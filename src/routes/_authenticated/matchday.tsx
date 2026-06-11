import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MatchdaySummaryCard } from "@/components/MatchdaySummaryCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getWCData, type WCMatch } from "@/lib/wc2026";
import type { Database } from "@/integrations/supabase/types";

type ReactionKind = Database["public"]["Enums"]["reaction_kind"];

interface Circle { id: string; name: string }
interface Reaction {
  id: string;
  user_id: string;
  match_id: string;
  match_label: string | null;
  minute: number | null;
  kind: ReactionKind;
  emoji: string | null;
  text: string | null;
  created_at: string;
}
interface LoyaltyEntry {
  id: string;
  event: string;
  nation_name: string | null;
  role: string | null;
  created_at: string;
}

const QUICK: { kind: ReactionKind; emoji: string; label: string }[] = [
  { kind: "goal", emoji: "⚽", label: "Goal" },
  { kind: "miss", emoji: "😱", label: "Miss" },
  { kind: "var", emoji: "📺", label: "VAR" },
  { kind: "red_card", emoji: "🟥", label: "Red" },
  { kind: "penalty", emoji: "🎯", label: "Pen" },
  { kind: "elimination", emoji: "💀", label: "Out" },
  { kind: "roast", emoji: "🔥", label: "Roast" },
  { kind: "hype", emoji: "🙌", label: "Hype" },
];

export const Route = createFileRoute("/_authenticated/matchday")({
  head: () => ({
    meta: [
      { title: "Matchday — Global Derby" },
      { name: "description", content: "Live World Cup 2026 match companion. React with your circle in real time — saved forever." },
    ],
  }),
  component: MatchdayPage,
});

function MatchdayPage() {
  const { user } = useAuth();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [circleId, setCircleId] = useState<string | null>(null);
  const [matches, setMatches] = useState<WCMatch[]>([]);
  const [match, setMatch] = useState<WCMatch | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyEntry[]>([]);
  const [text, setText] = useState("");
  const [minute, setMinute] = useState<string>("1");
  const [showSummary, setShowSummary] = useState(false);
  const [autoPrompted, setAutoPrompted] = useState<string | null>(null);
  const [filter, setFilter] = useState<"today" | "upcoming" | "all">("today");

  useEffect(() => {
    supabase.from("circles").select("id, name").then(({ data }) => {
      const list = (data ?? []) as Circle[];
      setCircles(list);
      if (list[0]) setCircleId(list[0].id);
    });
    getWCData().then(({ matches }) => {
      setMatches(matches);
      const live = matches.find((m) => !m.finished);
      setMatch(live ?? matches[0] ?? null);
    });
  }, []);

  const visibleMatches = useMemo(() => {
    const now = Date.now();
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    if (filter === "today") {
      return matches.filter((m) => m.kickoff >= start && m.kickoff < end);
    }
    if (filter === "upcoming") {
      return matches.filter((m) => m.kickoff.getTime() >= now).slice(0, 30);
    }
    return matches.slice(0, 60);
  }, [matches, filter]);

  useEffect(() => {
    if (!circleId || !match) return;
    void loadReactions();
    const ch = supabase
      .channel(`reactions-${circleId}-${match.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions", filter: `circle_id=eq.${circleId}` },
        (payload) => {
          const r = payload.new as Reaction;
          if (r.match_id === match.id) setReactions((prev) => [r, ...prev]);
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [circleId, match?.id]);

  async function loadReactions() {
    if (!circleId || !match) return;
    const { data } = await supabase
      .from("reactions")
      .select("*")
      .eq("circle_id", circleId)
      .eq("match_id", match.id)
      .order("created_at", { ascending: false })
      .limit(200);
    setReactions((data ?? []) as Reaction[]);
  }

  async function loadLoyalty() {
    if (!user) return [];
    const { data } = await supabase
      .from("loyalty_history")
      .select("id, event, nation_name, role, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    const list = (data ?? []) as LoyaltyEntry[];
    setLoyalty(list);
    return list;
  }

  async function react(kind: ReactionKind, emoji: string, body?: string) {
    if (!user || !circleId || !match) return;
    await supabase.from("reactions").insert({
      circle_id: circleId,
      user_id: user.id,
      match_id: match.id,
      match_label: match.label,
      minute: Number(minute) || null,
      kind,
      emoji,
      text: body ?? null,
    });
  }

  async function sendText(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await react("hype", "💬", text.trim());
    setText("");
  }

  async function openSummary() {
    await loadLoyalty();
    setShowSummary(true);
  }

  // Auto-prompt Wrapped when the match ends (finished flag, or 110 min past kickoff)
  useEffect(() => {
    if (!match || reactions.length === 0) return;
    if (autoPrompted === match.id) return;
    const ended = match.finished || Date.now() - match.kickoff.getTime() > 110 * 60_000;
    if (ended) {
      setAutoPrompted(match.id);
      void openSummary();
    }
  }, [match, reactions.length, autoPrompted]);

  if (circles.length === 0) {
    return (
      <AppShell eyebrow="Matchday Live">
        <div className="p-6 text-center space-y-4">
          <p className="text-sm text-white/70">You need a circle before saving reactions.</p>
          <Link to="/circles" className="inline-block bg-gold text-navy font-display font-black px-6 py-3 rounded-lg uppercase text-sm">
            Create a Circle
          </Link>
        </div>
      </AppShell>
    );
  }

  const currentCircle = circles.find((c) => c.id === circleId);

  return (
    <AppShell eyebrow="Matchday Live">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-japan-red animate-pulse" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-japan-red font-bold">FIFA WC 2026 · {minute}'</p>
        </div>

        {/* Fixture picker */}
        <section className="bg-gradient-to-br from-stadium/40 to-navy border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex gap-1 bg-white/5 rounded-lg p-1 text-[10px] uppercase font-bold tracking-widest">
            {(["today", "upcoming", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 rounded-md transition ${filter === f ? "bg-gold text-navy" : "text-white/60"}`}
              >
                {f}
              </button>
            ))}
          </div>

          <select
            value={match?.id ?? ""}
            onChange={(e) => setMatch(matches.find((m) => m.id === e.target.value) ?? null)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
          >
            {visibleMatches.length === 0 && <option value="">No matches in this view</option>}
            {visibleMatches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.kickoff.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} ·{" "}
                {m.home.fifa_code} vs {m.away.fifa_code} ({m.type === "group" ? `Grp ${m.group}` : m.type.toUpperCase()})
              </option>
            ))}
          </select>

          {match && (
            <div className="flex items-center justify-around pt-2">
              <Side flag={match.home.flag} name={match.home.name_en} code={match.home.fifa_code} />
              <div className="text-center">
                <p className="font-display font-extrabold text-3xl text-gold">
                  {match.homeScore ?? "—"} <span className="text-white/30">·</span> {match.awayScore ?? "—"}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-white/40 mt-1">
                  {match.type === "group" ? `Group ${match.group}` : match.type}
                </p>
              </div>
              <Side flag={match.away.flag} name={match.away.name_en} code={match.away.fifa_code} />
            </div>
          )}

          <div className="flex gap-2 items-center text-xs pt-1">
            <label className="text-white/40">Min</label>
            <input
              type="number"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className="w-14 bg-white/5 border border-white/10 rounded px-2 py-1 text-center"
            />
            <label className="text-white/40 ml-2">Circle</label>
            <select
              value={circleId ?? ""}
              onChange={(e) => setCircleId(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1"
            >
              {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold uppercase tracking-tight">Quick Reactions</h2>
          <div className="grid grid-cols-4 gap-2">
            {QUICK.map((q) => (
              <button
                key={q.kind}
                onClick={() => react(q.kind, q.emoji)}
                disabled={!match}
                className="py-3 rounded-xl bg-white/5 border border-white/10 hover:border-gold/40 hover:bg-white/10 transition flex flex-col items-center gap-1 disabled:opacity-40"
              >
                <span className="text-2xl">{q.emoji}</span>
                <span className="text-[10px] uppercase font-bold tracking-tight">{q.label}</span>
              </button>
            ))}
          </div>
          <form onSubmit={sendText} className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Say something to the circle..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
            />
            <button className="bg-gold text-navy font-bold px-4 rounded-lg text-sm">Post</button>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-bold uppercase tracking-tight">Reaction Timeline</h2>
            <button
              onClick={openSummary}
              disabled={reactions.length === 0}
              className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full bg-gold text-navy disabled:opacity-30"
            >
              Wrap & Share
            </button>
          </div>
          {reactions.length === 0 && <p className="text-xs text-white/40">No reactions yet — be the first.</p>}
          <div className="space-y-2">
            {reactions.map((r) => (
              <div key={r.id} className="flex gap-3 bg-white/5 border border-white/10 rounded-lg p-3 items-center">
                <span className="font-display font-bold text-gold text-sm w-10">{r.minute ?? "—"}'</span>
                <span className="text-2xl">{r.emoji ?? "•"}</span>
                <div className="flex-1 text-sm">
                  <p className="font-bold uppercase text-xs tracking-wider text-white/60">{r.kind.replace("_", " ")}</p>
                  {r.text && <p className="text-white/90">{r.text}</p>}
                </div>
                <span className="text-[10px] text-white/30">
                  {new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showSummary && match && (
        <MatchdaySummaryCard
          circleName={currentCircle?.name ?? "My Circle"}
          matchLabel={match.label}
          reactions={reactions}
          loyalty={loyalty}
          onClose={() => setShowSummary(false)}
        />
      )}
    </AppShell>
  );
}

function Side({ flag, name, code }: { flag: string; name: string; code: string }) {
  return (
    <div className="text-center w-24">
      <img src={flag} alt={name} className="w-12 h-8 object-cover rounded mx-auto mb-1 border border-white/10" />
      <p className="font-display font-bold text-xs uppercase tracking-tight truncate">{name}</p>
      <p className="text-[9px] text-white/40 tracking-widest">{code}</p>
    </div>
  );
}
