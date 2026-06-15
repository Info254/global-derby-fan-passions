import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ReactionKind = Database["public"]["Enums"]["reaction_kind"];

const VIBES: { kind: ReactionKind; emoji: string; label: string; color: string }[] = [
  { kind: "hype", emoji: "🙌", label: "Hype", color: "bg-gold" },
  { kind: "goal", emoji: "⚽", label: "Goals", color: "bg-stadium" },
  { kind: "roast", emoji: "🔥", label: "Roast", color: "bg-japan-red" },
  { kind: "var", emoji: "📺", label: "VAR-rage", color: "bg-silver" },
  { kind: "elimination", emoji: "💀", label: "Doom", color: "bg-white/30" },
];

interface Props { matchId: string }

export function VibeMeter({ matchId }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("reactions").select("kind").eq("match_id", matchId);
      if (cancelled) return;
      const c: Record<string, number> = {};
      for (const r of data ?? []) c[r.kind] = (c[r.kind] ?? 0) + 1;
      setCounts(c);
      setTotal((data ?? []).length);
    }
    void load();
    const ch = supabase
      .channel(`vibe-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const k = (payload.new as { kind: string }).kind;
          setCounts((prev) => ({ ...prev, [k]: (prev[k] ?? 0) + 1 }));
          setTotal((t) => t + 1);
        },
      )
      .subscribe();
    return () => { cancelled = true; void supabase.removeChannel(ch); };
  }, [matchId]);

  const max = Math.max(1, ...VIBES.map((v) => counts[v.kind] ?? 0));

  return (
    <section className="bg-gradient-to-br from-navy to-stadium/40 border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-baseline">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">🌡️ Stadium Vibe Meter</p>
        <p className="text-[10px] text-white/40 tabular-nums">{total} reactions</p>
      </div>
      {total === 0 ? (
        <p className="text-xs text-white/50 py-2">Be the first to set the tone.</p>
      ) : (
        <div className="space-y-2">
          {VIBES.map((v) => {
            const n = counts[v.kind] ?? 0;
            const pct = (n / max) * 100;
            return (
              <div key={v.kind} className="flex items-center gap-2 text-xs">
                <span className="w-20 text-white/70 flex items-center gap-1">
                  <span>{v.emoji}</span><span className="font-bold uppercase tracking-wide text-[10px]">{v.label}</span>
                </span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${v.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right tabular-nums text-white/70">{n}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
