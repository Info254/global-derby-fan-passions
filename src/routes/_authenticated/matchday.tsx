import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
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
      { name: "description", content: "Live match companion. React with your circle in real time — saved forever." },
    ],
  }),
  component: MatchdayPage,
});

const DEFAULT_MATCH_ID = "wc-2026-grpE-jpn-esp";
const DEFAULT_MATCH_LABEL = "Japan vs Spain";

function MatchdayPage() {
  const { user } = useAuth();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [circleId, setCircleId] = useState<string | null>(null);
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  const [matchLabel, setMatchLabel] = useState(DEFAULT_MATCH_LABEL);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [text, setText] = useState("");
  const [minute, setMinute] = useState<string>("67");

  useEffect(() => {
    supabase.from("circles").select("id, name").then(({ data }) => {
      const list = (data ?? []) as Circle[];
      setCircles(list);
      if (list[0]) setCircleId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!circleId) return;
    void loadReactions();
    const ch = supabase
      .channel(`reactions-${circleId}-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions", filter: `circle_id=eq.${circleId}` },
        (payload) => {
          const r = payload.new as Reaction;
          if (r.match_id === matchId) setReactions((prev) => [r, ...prev]);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [circleId, matchId]);

  async function loadReactions() {
    if (!circleId) return;
    const { data } = await supabase
      .from("reactions")
      .select("*")
      .eq("circle_id", circleId)
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })
      .limit(100);
    setReactions((data ?? []) as Reaction[]);
  }

  async function react(kind: ReactionKind, emoji: string, body?: string) {
    if (!user || !circleId) return;
    await supabase.from("reactions").insert({
      circle_id: circleId,
      user_id: user.id,
      match_id: matchId,
      match_label: matchLabel,
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

  return (
    <AppShell eyebrow="Matchday Live">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-japan-red animate-pulse" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-japan-red font-bold">Live · {minute}'</p>
        </div>

        <div className="bg-gradient-to-br from-stadium/40 to-navy border border-white/10 rounded-2xl p-5 space-y-4">
          <input
            value={matchLabel}
            onChange={(e) => setMatchLabel(e.target.value)}
            className="w-full bg-transparent font-display font-extrabold text-2xl uppercase tracking-tighter italic text-center focus:outline-none"
          />
          <div className="flex gap-2 items-center text-xs">
            <label className="text-white/40">Minute</label>
            <input
              type="number"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-center"
            />
            <label className="text-white/40 ml-3">Circle</label>
            <select
              value={circleId ?? ""}
              onChange={(e) => setCircleId(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1"
            >
              {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="font-display font-bold uppercase tracking-tight">Quick Reactions</h2>
          <div className="grid grid-cols-4 gap-2">
            {QUICK.map((q) => (
              <button
                key={q.kind}
                onClick={() => react(q.kind, q.emoji)}
                className="py-3 rounded-xl bg-white/5 border border-white/10 hover:border-gold/40 hover:bg-white/10 transition flex flex-col items-center gap-1"
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
          <h2 className="font-display font-bold uppercase tracking-tight">Reaction Timeline</h2>
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
    </AppShell>
  );
}
