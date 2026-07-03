import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MatchdaySummaryCard } from "@/components/MatchdaySummaryCard";
import { VibeMeter } from "@/components/VibeMeter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getWCData, type WCMatch } from "@/lib/wc2026";
import { useLiveScores, mergeLive, liveStatusFor } from "@/lib/live-merge";
import { NATIONS } from "@/lib/nations-data";
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
interface Template {
  id: string;
  kind: ReactionKind;
  label: string;
  emoji: string | null;
  text: string | null;
}

const DEFAULT_QUICK: { kind: ReactionKind; emoji: string; label: string; text?: string }[] = [
  { kind: "hype", emoji: "🙌", label: "Hype", text: "Let's gooo!" },
  { kind: "roast", emoji: "🔥", label: "Roast", text: "What was that?!" },
  { kind: "elimination", emoji: "💀", label: "Out", text: "Pack your bags." },
  { kind: "var", emoji: "📺", label: "VAR", text: "Check it!" },
  { kind: "goal", emoji: "⚽", label: "Goal" },
  { kind: "miss", emoji: "😱", label: "Miss" },
  { kind: "red_card", emoji: "🟥", label: "Red" },
  { kind: "penalty", emoji: "🎯", label: "Pen" },
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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingTpl, setEditingTpl] = useState(false);
  const [matchPoints, setMatchPoints] = useState<number>(0);
  const [showSolidarity, setShowSolidarity] = useState(false);
  const { live, loading: liveLoading } = useLiveScores();

  useEffect(() => {
    supabase.from("circles").select("id, name").then(({ data }) => {
      const list = (data ?? []) as Circle[];
      setCircles(list);
      if (list[0]) setCircleId(list[0].id);
    });
    getWCData().then(({ matches }) => {
      setMatches(matches);
    });
  }, []);

  // Merge live scores into fixtures whenever either changes.
  const mergedMatches = useMemo(() => mergeLive(matches, live), [matches, live]);

  // Pick a default match: prefer an in-progress one, else next upcoming.
  useEffect(() => {
    if (match || mergedMatches.length === 0) return;
    const now = Date.now();
    const inPlay = mergedMatches.find((m) => !m.finished && m.kickoff.getTime() <= now);
    const next = mergedMatches.find((m) => m.kickoff.getTime() >= now);
    setMatch(inPlay ?? next ?? mergedMatches[0]);
  }, [mergedMatches, match]);

  // Keep the currently-selected match's score fresh from live data.
  useEffect(() => {
    if (!match) return;
    const updated = mergedMatches.find((m) => m.id === match.id);
    if (updated && (updated.homeScore !== match.homeScore || updated.awayScore !== match.awayScore || updated.finished !== match.finished)) {
      setMatch(updated);
    }
  }, [mergedMatches, match]);

  const liveInfo = liveStatusFor(match, live);

  // Load templates (or seed defaults the first time)
  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("reaction_templates").select("*").eq("user_id", user.id).order("created_at");
      if (data && data.length > 0) {
        setTemplates(data as Template[]);
      } else {
        const seed = DEFAULT_QUICK.map((q) => ({
          user_id: user.id, kind: q.kind, label: q.label, emoji: q.emoji, text: q.text ?? null,
        }));
        const { data: inserted } = await supabase
          .from("reaction_templates").insert(seed).select();
        setTemplates((inserted ?? []) as Template[]);
      }
    })();
  }, [user]);

  const visibleMatches = useMemo(() => {
    const now = Date.now();
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    if (filter === "today") return mergedMatches.filter((m) => m.kickoff >= start && m.kickoff < end);
    if (filter === "upcoming") return mergedMatches.filter((m) => m.kickoff.getTime() >= now).slice(0, 30);
    return mergedMatches.slice(0, 60);
  }, [mergedMatches, filter]);

  useEffect(() => {
    if (!circleId || !match) return;
    void loadReactions();
    void loadMatchPoints();
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
      .from("reactions").select("*")
      .eq("circle_id", circleId).eq("match_id", match.id)
      .order("created_at", { ascending: false }).limit(200);
    setReactions((data ?? []) as Reaction[]);
  }

  async function loadMatchPoints() {
    if (!user || !match) return;
    const { data } = await supabase
      .from("points").select("delta").eq("user_id", user.id).eq("match_id", match.id);
    setMatchPoints((data ?? []).reduce((a, r) => a + (r.delta ?? 0), 0));
  }

  async function loadLoyalty() {
    if (!user) return [];
    const { data } = await supabase
      .from("loyalty_history")
      .select("id, event, nation_name, role, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(10);
    const list = (data ?? []) as LoyaltyEntry[];
    setLoyalty(list);
    return list;
  }

  async function react(kind: ReactionKind, emoji: string, body?: string) {
    if (!user || !circleId || !match) return;
    await supabase.from("reactions").insert({
      circle_id: circleId, user_id: user.id, match_id: match.id, match_label: match.label,
      minute: Number(minute) || null, kind, emoji, text: body ?? null,
    });
    setTimeout(loadMatchPoints, 400);
  }

  async function sendText(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await react("hype", "💬", text.trim());
    setText("");
  }

  async function saveTemplate(t: Template) {
    await supabase.from("reaction_templates")
      .update({ label: t.label, emoji: t.emoji, text: t.text }).eq("id", t.id);
  }

  async function standWith(nationCode: string, nationName: string) {
    if (!user || !circleId || !match) return;
    await supabase.from("solidarity").insert({
      user_id: user.id, circle_id: circleId, match_id: match.id,
      with_nation_code: nationCode, with_nation_name: nationName,
    });
    await react("hype", "🤝", `Standing with ${nationName}`);
    setShowSolidarity(false);
  }

  async function openSummary() {
    await loadLoyalty();
    setShowSummary(true);
  }

  useEffect(() => {
    if (!match || reactions.length === 0) return;
    if (autoPrompted === match.id) return;
    const ended = match.finished || Date.now() - match.kickoff.getTime() > 110 * 60_000;
    if (ended) { setAutoPrompted(match.id); void openSummary(); }
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
  // Suggest solidarity options: nations playing in this match that aren't your primary
  const solidarityOptions = match
    ? [match.home, match.away].map((t) => ({
        code: t.fifa_code,
        name: t.name_en,
        flag: t.flag,
      }))
    : [];

  return (
    <AppShell eyebrow="Matchday Live">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${liveInfo && !["NS","TBD","PST","CANC"].includes(liveInfo.status) ? "bg-japan-red animate-pulse" : "bg-white/30"}`} />
            <p className="text-[10px] uppercase tracking-[0.3em] text-japan-red font-bold">
              {liveInfo
                ? `FIFA WC 2026 · ${liveInfo.status}${liveInfo.minute ? ` ${liveInfo.minute}'` : ""}`
                : liveLoading ? "Loading live scores…" : `FIFA WC 2026 · ${minute}'`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest text-white/40">Match Points</p>
            <p className="font-display font-extrabold text-gold text-lg leading-none tabular-nums">+{matchPoints}</p>
          </div>
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
            <input type="number" value={minute} onChange={(e) => setMinute(e.target.value)}
              className="w-14 bg-white/5 border border-white/10 rounded px-2 py-1 text-center" />
            <label className="text-white/40 ml-2">Circle</label>
            <select value={circleId ?? ""} onChange={(e) => setCircleId(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1">
              {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </section>

        {match && <VibeMeter matchId={match.id} />}

        {/* Solidarity */}
        <section className="bg-gradient-to-r from-gold/20 via-stadium/20 to-japan-red/20 border border-gold/30 rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gold">🤝 Stand With</p>
              <p className="text-xs text-white/70 mt-0.5">Show cross-continental love (like Africa for Mexico).</p>
            </div>
            <button onClick={() => setShowSolidarity((s) => !s)}
              className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full bg-gold text-navy">
              {showSolidarity ? "Close" : "+10 pts"}
            </button>
          </div>
          {showSolidarity && (
            <div className="mt-3 space-y-2">
              {solidarityOptions.map((o) => (
                <button key={o.code} onClick={() => standWith(o.code, o.name)}
                  className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm">
                  <img src={o.flag} alt={o.name} className="w-8 h-5 object-cover rounded" />
                  <span className="font-semibold">Stand with {o.name}</span>
                </button>
              ))}
              <details className="text-xs text-white/60">
                <summary className="cursor-pointer">Pick another nation...</summary>
                <select onChange={(e) => {
                  const n = NATIONS.find((x) => x.code === e.target.value);
                  if (n) void standWith(n.code, n.name);
                }} className="w-full mt-2 bg-navy border border-white/10 rounded-lg px-3 py-2 text-sm">
                  <option value="">—</option>
                  {NATIONS.map((n) => <option key={n.code} value={n.code}>{n.flag} {n.name}</option>)}
                </select>
              </details>
            </div>
          )}
        </section>

        {/* Quick reactions with editable templates */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-bold uppercase tracking-tight">Quick Reactions</h2>
            <button onClick={() => setEditingTpl((e) => !e)}
              className="text-[10px] uppercase font-bold tracking-widest text-gold">
              {editingTpl ? "Done" : "Edit"}
            </button>
          </div>

          {editingTpl ? (
            <div className="space-y-2">
              {templates.map((t, i) => (
                <div key={t.id} className="bg-white/5 border border-white/10 rounded-lg p-3 grid grid-cols-[3rem_1fr_2fr] gap-2 items-center">
                  <input value={t.emoji ?? ""} maxLength={2}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTemplates((ts) => ts.map((x, j) => j === i ? { ...x, emoji: v } : x));
                    }}
                    onBlur={() => saveTemplate(templates[i])}
                    className="bg-navy border border-white/10 rounded px-2 py-1.5 text-center text-lg" />
                  <input value={t.label}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTemplates((ts) => ts.map((x, j) => j === i ? { ...x, label: v } : x));
                    }}
                    onBlur={() => saveTemplate(templates[i])}
                    className="bg-navy border border-white/10 rounded px-2 py-1.5 text-xs uppercase font-bold" />
                  <input value={t.text ?? ""} placeholder="Optional message..."
                    onChange={(e) => {
                      const v = e.target.value;
                      setTemplates((ts) => ts.map((x, j) => j === i ? { ...x, text: v } : x));
                    }}
                    onBlur={() => saveTemplate(templates[i])}
                    className="bg-navy border border-white/10 rounded px-2 py-1.5 text-xs" />
                </div>
              ))}
              <p className="text-[10px] text-white/40 text-center">Changes save automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {templates.map((t) => (
                <button key={t.id} onClick={() => react(t.kind, t.emoji ?? "•", t.text ?? undefined)}
                  disabled={!match}
                  className="py-3 rounded-xl bg-white/5 border border-white/10 hover:border-gold/40 hover:bg-white/10 transition flex flex-col items-center gap-1 disabled:opacity-40">
                  <span className="text-2xl">{t.emoji ?? "•"}</span>
                  <span className="text-[10px] uppercase font-bold tracking-tight">{t.label}</span>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={sendText} className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Say something to the circle..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm" />
            <button className="bg-gold text-navy font-bold px-4 rounded-lg text-sm">Post</button>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-bold uppercase tracking-tight">Reaction Timeline</h2>
            <button onClick={openSummary} disabled={reactions.length === 0}
              className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full bg-gold text-navy disabled:opacity-30">
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
