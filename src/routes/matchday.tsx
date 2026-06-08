import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/matchday")({
  head: () => ({
    meta: [
      { title: "Matchday — Global Derby" },
      { name: "description", content: "Live match companion. React with your circle in real time." },
    ],
  }),
  component: Matchday,
});

function Matchday() {
  return (
    <AppShell eyebrow="Matchday Live">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-japan-red animate-pulse" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-japan-red font-bold">
            Live · 67'
          </p>
        </div>

        <div className="bg-gradient-to-br from-stadium/40 to-navy border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-center space-y-2">
              <div className="size-16 mx-auto bg-white rounded-full flex items-center justify-center">
                <div className="size-10 rounded-full bg-japan-red" />
              </div>
              <p className="font-display font-bold text-xl uppercase">Japan</p>
            </div>
            <div className="font-display font-extrabold text-5xl tracking-tighter italic">
              1 – 1
            </div>
            <div className="text-center space-y-2">
              <div className="size-16 mx-auto bg-[#AA151B] rounded-full flex items-center justify-center">
                <div className="size-10 rounded-full bg-[#F1BF00]" />
              </div>
              <p className="font-display font-bold text-xl uppercase">Spain</p>
            </div>
          </div>
          <div className="pt-4 border-t border-white/10">
            <p className="text-[10px] uppercase text-white/40 mb-2">Family Support</p>
            <div className="flex h-3 rounded-full overflow-hidden">
              <div className="bg-japan-red" style={{ width: "65%" }} />
              <div className="bg-gold" style={{ width: "35%" }} />
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="font-bold">Japan 65%</span>
              <span className="font-bold text-gold">Spain 35%</span>
            </div>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="font-display font-bold uppercase tracking-tight">
            Quick Reactions
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { emoji: "🔥", label: "Goal" },
              { emoji: "😱", label: "Miss" },
              { emoji: "😂", label: "VAR" },
              { emoji: "😭", label: "Out" },
            ].map((r) => (
              <button
                key={r.label}
                className="py-4 rounded-xl bg-white/5 border border-white/10 hover:border-gold/40 hover:bg-white/10 transition flex flex-col items-center gap-1"
              >
                <span className="text-2xl">{r.emoji}</span>
                <span className="text-[10px] uppercase font-bold tracking-tight">
                  {r.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold uppercase tracking-tight">
            Live Timeline
          </h2>
          <div className="space-y-3">
            {[
              { time: "67'", text: "Sarah reacted 🔥 to Japan's chance" },
              { time: "61'", text: "GOAL — Spain equalizes via Pedri" },
              { time: "45'", text: "Dad: 'Told you Japan would score first'" },
              { time: "23'", text: "GOAL — Japan 1-0 (Mitoma)" },
            ].map((e, i) => (
              <div
                key={i}
                className="flex gap-4 bg-white/5 border border-white/10 rounded-lg p-3"
              >
                <span className="font-display font-bold text-gold text-sm w-10">
                  {e.time}
                </span>
                <p className="text-sm text-white/80">{e.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
