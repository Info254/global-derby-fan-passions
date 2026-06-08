import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/circles")({
  head: () => ({
    meta: [
      { title: "Circles — Global Derby" },
      { name: "description", content: "Family and friend circles. Vote, predict, and roast." },
    ],
  }),
  component: Circles,
});

function Circles() {
  const breakdown = [
    { flag: "🇧🇷", name: "Brazil", count: 3, color: "bg-gold" },
    { flag: "🇲🇦", name: "Morocco", count: 2, color: "bg-japan-red" },
    { flag: "🇦🇷", name: "Argentina", count: 2, color: "bg-stadium" },
    { flag: "🇯🇵", name: "Japan", count: 1, color: "bg-silver" },
  ];
  return (
    <AppShell eyebrow="Derby Circles">
      <div className="p-6 space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gold font-bold">
            Your Circle
          </p>
          <h1 className="font-display font-extrabold text-3xl uppercase tracking-tighter italic">
            The Mwangi Family
          </h1>
          <p className="text-sm text-white/60 mt-1">8 members · 4 nations</p>
        </div>

        <section className="bg-stadium/20 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold uppercase tracking-tight text-sm">
            Support Breakdown
          </h2>
          <div className="space-y-3">
            {breakdown.map((b) => (
              <div key={b.name} className="flex items-center gap-3">
                <span className="text-xl">{b.flag}</span>
                <span className="font-semibold text-sm w-24">{b.name}</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${b.color}`}
                    style={{ width: `${(b.count / 8) * 100}%` }}
                  />
                </div>
                <span className="font-display font-bold text-sm w-4 text-right">
                  {b.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-bold uppercase tracking-tight text-sm">
              Tonight's Vote
            </h2>
            <span className="text-[10px] text-gold uppercase font-bold">5h left</span>
          </div>
          <p className="text-sm text-white/70">Who wins Brazil vs Argentina?</p>
          <div className="grid grid-cols-3 gap-2">
            {["Brazil", "Draw", "Argentina"].map((opt) => (
              <button
                key={opt}
                className="py-3 rounded-lg bg-white/5 border border-white/10 hover:border-gold/40 hover:bg-white/10 transition text-sm font-bold uppercase tracking-tight"
              >
                {opt}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-br from-japan-red/20 to-transparent border border-japan-red/30 rounded-2xl p-5 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-japan-red font-bold">
            Bandwagon Alert
          </p>
          <p className="text-sm">
            Dad, Kevin, and Aunt Grace all switched teams this week. 🫣
          </p>
        </section>
      </div>
    </AppShell>
  );
}
