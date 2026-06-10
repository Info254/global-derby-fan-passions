import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CONTINENT_META, NATIONS, nationsByContinent, type Continent } from "@/lib/nations-data";

export const Route = createFileRoute("/nations")({
  head: () => ({
    meta: [
      { title: "Nations — Global Derby" },
      { name: "description", content: "Every nation in the 2026 World Cup, ranked by FIFA rating and grouped by continent." },
      { property: "og:title", content: "Nations — Global Derby" },
      { property: "og:description", content: "Pick your second team. Browse every World Cup nation." },
    ],
  }),
  component: Nations,
});

function Nations() {
  const groups = nationsByContinent();
  const continents = Object.keys(groups) as Continent[];
  const sortedTop = [...NATIONS].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)).slice(0, 5);

  return (
    <AppShell eyebrow="Nations Explorer">
      <div className="p-6 space-y-8">
        <div>
          <h1 className="font-display font-extrabold text-3xl uppercase tracking-tighter italic">
            Pick Your Continent
          </h1>
          <p className="text-sm text-white/60 mt-2">Every nation has a story. Find yours.</p>
        </div>

        <section className="bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 rounded-2xl p-5 space-y-3">
          <p className="text-[10px] uppercase tracking-widest font-bold text-gold">Top 5 — World Rank</p>
          <div className="space-y-2">
            {sortedTop.map((n, i) => (
              <Link key={n.code} to="/nations/$code" params={{ code: n.code }} className="flex items-center gap-3 text-sm hover:text-gold transition">
                <span className="font-display font-bold w-6 text-gold">#{n.rank}</span>
                <span className="text-xl">{n.flag}</span>
                <span className="font-bold flex-1">{n.name}</span>
                <span className="text-[10px] text-white/40 uppercase">{n.continent}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          {continents.map((c) => {
            const meta = CONTINENT_META[c];
            const list = groups[c] ?? [];
            return (
              <div key={c} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-[10px] uppercase tracking-widest font-bold ${meta.accent}`}>{meta.label}</p>
                    <h2 className="font-display font-bold text-xl uppercase tracking-tight mt-1">{meta.full}</h2>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-extrabold text-2xl">{list.length}</p>
                    <p className="text-[10px] text-white/40 uppercase">Nations</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {list
                    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
                    .map((n) => (
                      <Link
                        key={n.code}
                        to="/nations/$code"
                        params={{ code: n.code }}
                        className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-2 transition"
                      >
                        <span className="text-base">{n.flag}</span>
                        <span className="font-bold truncate flex-1">{n.name}</span>
                        {n.rank && <span className="text-white/40 text-[10px]">#{n.rank}</span>}
                      </Link>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
