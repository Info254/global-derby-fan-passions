import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/passport")({
  head: () => ({
    meta: [
      { title: "Passport — Global Derby" },
      { name: "description", content: "Your fandom passport. Every allegiance, stamped." },
    ],
  }),
  component: Passport,
});

const stamps = [
  { country: "JAPAN", role: "Primary Hope", date: "NOV 2022", color: "border-japan-red" },
  { country: "MOROCCO", role: "Second Home", date: "DEC 2022", color: "border-stadium" },
  { country: "CANADA", role: "The Underdog", date: "MAR 2026", color: "border-bronze" },
  { country: "BRAZIL", role: "Family Vote", date: "JUN 2026", color: "border-gold" },
];

function Passport() {
  return (
    <AppShell eyebrow="Fandom Passport">
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-br from-stadium to-navy border border-gold/30 rounded-2xl p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-4 right-4 size-20 border-2 border-gold/30 rounded-full flex items-center justify-center rotate-12">
            <span className="text-[8px] text-gold/60 uppercase tracking-tighter font-bold text-center leading-tight">
              World<br/>Cup<br/>2026
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">
            Global Derby Passport
          </p>
          <div>
            <p className="text-[10px] uppercase text-white/40">Owner</p>
            <h1 className="font-display font-extrabold text-3xl uppercase tracking-tighter italic">
              John Doe
            </h1>
          </div>
          <div className="pt-2 border-t border-white/10">
            <p className="text-[10px] uppercase text-white/40">Tournament</p>
            <p className="font-display font-bold text-lg">FIFA World Cup 2026</p>
          </div>
        </div>

        <h2 className="font-display font-bold uppercase tracking-tight">
          Allegiance Stamps
        </h2>

        <div className="space-y-3">
          {stamps.map((s) => (
            <div
              key={s.country}
              className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] uppercase text-white/40">{s.role}</p>
                <p className="font-display font-extrabold text-2xl uppercase tracking-tighter italic mt-1">
                  {s.country}
                </p>
                <p className="text-[10px] uppercase text-white/60 mt-1">
                  Stamped · {s.date}
                </p>
              </div>
              <div
                className={`size-16 rounded-full border-4 ${s.color} flex items-center justify-center rotate-[-8deg]`}
              >
                <span className="text-[8px] font-bold text-white/70 uppercase tracking-tighter text-center leading-tight">
                  Verified<br/>Fan
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
