import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getGlobalLeaderboard, type GlobalLeaderRow } from "@/lib/points";
import { getWCData, type WCMatch } from "@/lib/wc2026";
import { computeGroupTable } from "@/lib/standings";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Global Derby" },
      { name: "description", content: "Top fans worldwide — points + nations that have advanced." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [rows, setRows] = useState<GlobalLeaderRow[]>([]);
  const [matches, setMatches] = useState<WCMatch[]>([]);
  const [tab, setTab] = useState<"survivors" | "points">("survivors");

  useEffect(() => {
    void getGlobalLeaderboard(200).then(setRows);
    void getWCData().then((d) => setMatches(d.matches));
  }, []);

  const advancedCodes = useMemo(() => {
    if (!matches.length) return new Set<string>();
    const groups = new Set(matches.filter((m) => m.type === "group").map((m) => m.group));
    const set = new Set<string>();
    for (const g of groups) {
      const groupMatches = matches.filter((m) => m.group === g && m.type === "group");
      if (!groupMatches.length || !groupMatches.every((m) => m.finished)) continue;
      const table = computeGroupTable(matches, g);
      table.slice(0, 2).forEach((r) => set.add(r.team.fifa_code));
    }
    return set;
  }, [matches]);

  const enriched = useMemo(() => {
    return rows
      .map((r) => {
        const adv = r.nation_codes.filter((c) => advancedCodes.has(c)).length;
        const bonus = adv * 50;
        return { ...r, advanced_count: adv, bonus, score: r.total + bonus };
      })
      .sort((a, b) => (tab === "survivors" ? b.score - a.score : b.total - a.total));
  }, [rows, advancedCodes, tab]);

  return (
    <AppShell eyebrow="Global Leaderboard">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display font-extrabold text-3xl uppercase tracking-tighter italic">
            World Standings
          </h1>
          <p className="text-sm text-white/60 mt-2">
            Stand with your team and earn. <span className="text-gold font-bold">+50 bonus</span> per stamped nation that survives the group stage.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTab("survivors")}
            className={`text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-full border ${tab === "survivors" ? "bg-gold text-navy border-gold" : "bg-white/5 border-white/10 text-white/60"}`}
          >
            🏆 Survivors
          </button>
          <button
            onClick={() => setTab("points")}
            className={`text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-full border ${tab === "points" ? "bg-gold text-navy border-gold" : "bg-white/5 border-white/10 text-white/60"}`}
          >
            ⚡ Raw Points
          </button>
        </div>

        <section className="bg-gradient-to-br from-stadium/30 to-navy border border-gold/30 rounded-2xl p-5 space-y-3">
          {enriched.length === 0 && <p className="text-xs text-white/50">No fans on the board yet.</p>}
          <ol className="space-y-2">
            {enriched.slice(0, 50).map((l, i) => {
              const score = tab === "survivors" ? l.total + l.bonus : l.total;
              return (
                <li key={l.user_id} className="flex items-center gap-3 text-sm py-1">
                  <span className={`w-7 text-center font-display font-extrabold ${i === 0 ? "text-gold" : i === 1 ? "text-silver" : i === 2 ? "text-bronze" : "text-white/40"}`}>
                    {i + 1}
                  </span>
                  <div className="size-9 rounded-full bg-white/10 grid place-items-center text-sm font-bold">
                    {l.display_name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{l.display_name}</p>
                    <p className="text-[10px] uppercase text-white/40 tracking-wider">
                      {l.primary_nation_name ?? "No primary"}
                      {l.advanced_count > 0 && <span className="text-gold"> · {l.advanced_count} advanced</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-extrabold text-gold tabular-nums">{score}</p>
                    {tab === "survivors" && l.bonus > 0 && (
                      <p className="text-[10px] text-stadium tabular-nums">+{l.bonus} bonus</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </AppShell>
  );
}
