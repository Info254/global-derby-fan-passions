import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — Global Derby" },
      {
        name: "description",
        content:
          "Your loyalties, your nations, your tournament. Track your primary nation, second home, and underdog through the World Cup.",
      },
      { property: "og:title", content: "Home — Global Derby" },
      {
        property: "og:description",
        content: "Every fan has a second team. See yours.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <AppShell>
      <div className="p-6 space-y-8">
        {/* Hero: Current Primary Nation */}
        <section className="relative">
          <div className="absolute -top-3 -right-2 bg-japan-red text-white text-[10px] font-bold px-2.5 py-1 rounded skew-x-[-12deg] z-10 shadow-lg">
            PRIMARY NATION
          </div>
          <div className="bg-gradient-to-br from-japan-red via-[#80001e] to-navy rounded-2xl p-6 border border-white/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 bg-white rotate-45 translate-x-12 -translate-y-8" />

            <div className="flex items-center gap-4 mb-6">
              <div className="size-16 bg-white rounded-lg flex items-center justify-center shadow-2xl">
                <div className="size-10 rounded-full bg-japan-red" />
              </div>
              <div>
                <h1 className="font-display font-extrabold text-3xl uppercase tracking-tighter italic">
                  Japan
                </h1>
                <p className="text-white/80 text-sm font-medium">
                  Blue Samurai · #18 World Rank
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest">
                    Next Match
                  </p>
                  <p className="font-display font-bold text-lg">vs Spain</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/60 uppercase tracking-widest">
                    Tournament Vibe
                  </p>
                  <p className="font-display font-bold text-lg">Disciplined</p>
                </div>
              </div>
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white w-2/3" />
              </div>
              <p className="text-[10px] text-white/50 uppercase tracking-widest">
                Group E · 2 of 3 played
              </p>
            </div>
          </div>
        </section>

        {/* Loyalty Passport */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-bold uppercase tracking-tight">
              Loyalty Passport
            </h2>
            <span className="text-xs text-gold font-semibold uppercase">
              4 Stamps Collected
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                tag: "Primary",
                name: "JAPAN",
                meta: "EST. NOV 2022",
                ring: "border-japan-red/20",
                metaColor: "text-japan-red",
                badge: "Verified Fan",
                badgeColor: "text-japan-red/40",
              },
              {
                tag: "The Choice",
                name: "MOROCCO",
                meta: "ADOPTED 2022",
                ring: "border-stadium/30",
                metaColor: "text-stadium",
                badge: "Underdog",
                badgeColor: "text-stadium/40",
              },
              {
                tag: "Wildcard",
                name: "CANADA",
                meta: "JOINED 2026",
                ring: "border-bronze/30",
                metaColor: "text-bronze",
                badge: "Hopeful",
                badgeColor: "text-bronze/50",
              },
              {
                tag: "Family Pick",
                name: "BRAZIL",
                meta: "VOTED IN",
                ring: "border-gold/30",
                metaColor: "text-gold",
                badge: "Circle",
                badgeColor: "text-gold/40",
              },
            ].map((s) => (
              <div
                key={s.name}
                className="bg-white/5 border border-white/10 p-4 rounded-xl relative overflow-hidden"
              >
                <div
                  className={`absolute -bottom-2 -right-2 size-16 border-4 ${s.ring} rounded-full -rotate-12 flex items-center justify-center`}
                >
                  <span className={`text-[8px] font-bold ${s.badgeColor} uppercase tracking-tighter`}>
                    {s.badge}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 uppercase mb-2">{s.tag}</p>
                <p className="font-display font-bold text-lg">{s.name}</p>
                <p className={`text-[10px] font-bold ${s.metaColor}`}>{s.meta}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Loyalty Journey */}
        <section className="space-y-4">
          <h2 className="font-display font-bold uppercase tracking-tight">
            Loyalty Journey
          </h2>
          <div className="relative flex items-center justify-between px-1">
            <div className="absolute left-0 right-0 h-px bg-white/15 top-3 -z-0" />
            {[
              { label: "Groups", done: true },
              { label: "R16", done: true },
              { label: "QF", done: false },
              { label: "SF", done: false },
              { label: "Final", done: false },
            ].map((step) => (
              <div key={step.label} className="relative flex flex-col items-center gap-2">
                <div
                  className={`size-6 rounded-full ring-4 ring-navy ${
                    step.done
                      ? "bg-gold flex items-center justify-center"
                      : "bg-card border border-white/15"
                  }`}
                >
                  {step.done && (
                    <span className="text-navy text-[10px] font-extrabold">✓</span>
                  )}
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider ${
                    step.done ? "text-gold" : "text-white/40"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Family Rivalries */}
        <section className="space-y-4">
          <h2 className="font-display font-bold uppercase tracking-tight">
            Family Rivalries
          </h2>
          <div className="bg-stadium/20 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <span className="text-sm font-bold">The Mwangi Family</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                8 Members
              </span>
            </div>
            <div className="p-4 space-y-4">
              {[
                {
                  initial: "D",
                  text: (
                    <>
                      Dad{" "}
                      <span className="text-white/40 font-normal">switched to</span>{" "}
                      Argentina
                    </>
                  ),
                  meta: "Bandwagon Alert",
                  italic: true,
                  color: "text-white",
                },
                {
                  initial: "S",
                  text: (
                    <>
                      Sarah{" "}
                      <span className="text-white/40 font-normal">joined</span>{" "}
                      Japan Army
                    </>
                  ),
                  meta: "2h ago",
                  italic: false,
                  color: "text-japan-red italic",
                },
                {
                  initial: "K",
                  text: (
                    <>
                      Kevin{" "}
                      <span className="text-white/40 font-normal">predicted</span>{" "}
                      Germany upset
                    </>
                  ),
                  meta: "Yesterday",
                  italic: false,
                  color: "text-white",
                },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-8 rounded-full bg-white/10 grid place-items-center font-bold ${row.color}`}
                    >
                      {row.initial}
                    </div>
                    <p className="font-semibold">{row.text}</p>
                  </div>
                  <span
                    className={`text-[10px] text-white/40 ${row.italic ? "italic" : ""}`}
                  >
                    {row.meta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* World Cup Wrapped */}
        <section className="p-6 bg-gradient-to-t from-gold/20 to-transparent border border-gold/30 rounded-2xl text-center space-y-3">
          <p className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase italic">
            Tournament Memory
          </p>
          <h2 className="font-display font-extrabold text-2xl uppercase italic">
            Your 2026 Journey
          </h2>
          <p className="text-sm text-white/70">
            You've supported 3 underdogs and survived 2 penalty shootouts. See your
            story.
          </p>
          <button className="w-full bg-gold text-navy font-display font-black py-3 rounded-lg uppercase tracking-tight text-sm hover:brightness-110 transition">
            Unlock Wrapped
          </button>
        </section>
      </div>
    </AppShell>
  );
}
