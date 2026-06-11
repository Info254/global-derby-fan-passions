import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { Database } from "@/integrations/supabase/types";

type ReactionKind = Database["public"]["Enums"]["reaction_kind"];

interface Reaction {
  id: string;
  kind: ReactionKind;
  emoji: string | null;
  text: string | null;
  minute: number | null;
  user_id: string;
}

interface LoyaltyEntry {
  id: string;
  event: string;
  nation_name: string | null;
  role: string | null;
  created_at: string;
}

interface Props {
  circleName: string;
  matchLabel: string;
  reactions: Reaction[];
  loyalty: LoyaltyEntry[];
  onClose: () => void;
}

export function MatchdaySummaryCard({ circleName, matchLabel, reactions, loyalty, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const counts = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1;
    return acc;
  }, {});
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const loudest = reactions.find((r) => r.text);
  const totalFans = new Set(reactions.map((r) => r.user_id)).size;

  async function shareCard() {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#0a1429" });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `global-derby-${Date.now()}.png`, { type: "image/png" });
      const text = `${matchLabel} — ${reactions.length} reactions from ${circleName}. via Global Derby`;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: "Global Derby" });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = file.name;
        a.click();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto">
      <div className="w-full max-w-sm space-y-4">
        <div
          ref={cardRef}
          className="rounded-3xl p-6 bg-gradient-to-br from-stadium via-navy to-black border border-gold/30 shadow-2xl space-y-5"
          style={{ fontFamily: "inherit" }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-gold font-bold">Matchday Wrapped</p>
              <h2 className="font-display font-extrabold text-2xl uppercase italic tracking-tighter mt-1 text-white">
                {matchLabel}
              </h2>
            </div>
            <span className="text-[9px] uppercase tracking-widest text-white/40">{circleName}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Reactions" value={reactions.length} />
            <Stat label="Fans" value={totalFans} />
            <Stat label="Loyalty" value={loyalty.length} />
          </div>

          {top.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Top Moments</p>
              <div className="grid grid-cols-2 gap-1.5">
                {top.map(([kind, n]) => (
                  <div key={kind} className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1.5 text-xs">
                    <span className="font-display font-bold text-gold">{n}×</span>
                    <span className="uppercase text-white/80 text-[10px] font-bold tracking-tight">{kind.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loudest && (
            <div className="border-l-2 border-gold/60 pl-3 italic text-sm text-white/90">
              "{loudest.text}"
            </div>
          )}

          {loyalty.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Loyalty Shifts</p>
              {loyalty.slice(0, 3).map((l) => (
                <p key={l.id} className="text-xs text-white/80">
                  <span className="text-gold font-bold uppercase mr-1">{l.event.replace("_", " ")}</span>
                  {l.nation_name ?? "—"} <span className="text-white/40">· {l.role ?? ""}</span>
                </p>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-white/10 flex justify-between items-end">
            <p className="font-display font-black text-base uppercase tracking-tighter text-white">Global Derby</p>
            <p className="text-[9px] uppercase tracking-widest text-white/40">The World Cup through the eyes of fans</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/10 border border-white/10 font-bold uppercase text-xs tracking-widest text-white"
          >
            Close
          </button>
          <button
            onClick={shareCard}
            disabled={busy}
            className="flex-[2] py-3 rounded-xl bg-gold text-navy font-display font-black uppercase text-xs tracking-widest disabled:opacity-60"
          >
            {busy ? "Rendering…" : "Share Card"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/5 rounded-xl py-2">
      <p className="font-display font-extrabold text-2xl text-white">{value}</p>
      <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold mt-0.5">{label}</p>
    </div>
  );
}
