import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/nations")({
  head: () => ({
    meta: [
      { title: "Nations — Global Derby" },
      { name: "description", content: "Explore every nation in the World Cup by continent." },
    ],
  }),
  component: Nations,
});

const continents = [
  { code: "CAF", name: "Africa", count: 54, top: ["Morocco", "Senegal", "Nigeria"], accent: "text-gold" },
  { code: "UEFA", name: "Europe", count: 55, top: ["France", "England", "Spain"], accent: "text-silver" },
  { code: "AFC", name: "Asia", count: 47, top: ["Japan", "South Korea", "Iran"], accent: "text-japan-red" },
  { code: "CONMEBOL", name: "South America", count: 10, top: ["Brazil", "Argentina", "Uruguay"], accent: "text-bronze" },
  { code: "CONCACAF", name: "North America", count: 41, top: ["USA", "Mexico", "Canada"], accent: "text-stadium" },
  { code: "OFC", name: "Oceania", count: 11, top: ["New Zealand", "Fiji", "Tahiti"], accent: "text-white/70" },
];

function Nations() {
  return (
    <AppShell eyebrow="Nations Explorer">
      <div className="p-6 space-y-4">
        <h1 className="font-display font-extrabold text-3xl uppercase tracking-tighter italic mb-2">
          Pick Your Continent
        </h1>
        <p className="text-sm text-white/60 mb-6">
          Every nation has a story. Find yours.
        </p>
        <div className="space-y-3">
          {continents.map((c) => (
            <div
              key={c.code}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex justify-between items-center hover:bg-white/10 transition"
            >
              <div>
                <p className={`text-[10px] uppercase tracking-widest font-bold ${c.accent}`}>
                  {c.code}
                </p>
                <h2 className="font-display font-bold text-xl uppercase tracking-tight mt-1">
                  {c.name}
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  {c.top.join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-extrabold text-2xl">{c.count}</p>
                <p className="text-[10px] text-white/40 uppercase">Nations</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
