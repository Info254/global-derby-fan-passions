import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/Flag";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getWCData, groupMatchesByDay, type WCMatch } from "@/lib/wc2026";
import { useLiveScores, mergeLive } from "@/lib/live-merge";
import { computeGroupTable } from "@/lib/standings";
import { getStars } from "@/lib/top-players";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Global Derby" },
      { name: "description", content: "Every fixture, your teams highlighted, points per match, group standings, and star players to rally behind." },
    ],
  }),
  component: ProgressPage,
});

interface MyStamp { nation_code: string; nation_name: string; role: string; }
interface MyPoint { delta: number; match_id: string | null; reason: string; }

function ProgressPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<WCMatch[]>([]);
  const [stamps, setStamps] = useState<MyStamp[]>([]);
  const [points, setPoints] = useState<MyPoint[]>([]);
  const [filter, setFilter] = useState<"all" | "mine">("mine");

  useEffect(() => {
    void getWCData().then((d) => setMatches(d.matches));
  }, []);

  useEffect(() => {
    if (!user) return;
    void supabase.from("stamps").select("nation_code, nation_name, role").eq("user_id", user.id).then(({ data }) => {
      setStamps((data ?? []) as MyStamp[]);
    });
    void supabase.from("points").select("delta, match_id, reason").eq("user_id", user.id).then(({ data }) => {
      setPoints((data ?? []) as MyPoint[]);
    });
  }, [user]);

  const myCodes = useMemo(() => new Set(stamps.map((s) => s.nation_code)), [stamps]);
  const primary = stamps.find((s) => s.role === "primary");
  const pointsByMatch = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of points) {
      if (!p.match_id) continue;
      m.set(p.match_id, (m.get(p.match_id) ?? 0) + p.delta);
    }
    return m;
  }, [points]);
  const totalPoints = points.reduce((a, p) => a + p.delta, 0);

  const visible = useMemo(() => {
    if (filter === "all") return matches;
    return matches.filter((m) => myCodes.has(m.home.fifa_code) || myCodes.has(m.away.fifa_code));
  }, [matches, filter, myCodes]);

  const byDay = useMemo(() => groupMatchesByDay(visible), [visible]);
  const days = Array.from(byDay.keys()).sort();

  const myGroups = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) if (myCodes.has(m.home.fifa_code) || myCodes.has(m.away.fifa_code)) set.add(m.group);
    return Array.from(set).filter(Boolean).sort();
  }, [matches, myCodes]);

  const nextForMe = useMemo(() => {
    const now = Date.now();
    return matches.find(
      (m) => !m.finished && m.kickoff.getTime() >= now && (myCodes.has(m.home.fifa_code) || myCodes.has(m.away.fifa_code)),
    );
  }, [matches, myCodes]);

  const stars = primary ? getStars(primary.nation_code) : [];

  return (
    <AppShell eyebrow="Tournament Progress">
      <div className="p-6 space-y-6">
        <header className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Your Tournament</p>
          <h1 className="font-display font-extrabold text-3xl uppercase tracking-tighter italic">Progress Hub</h1>
          <p className="text-sm text-white/60">Every fixture. Your teams glowing. Points stacking.</p>
        </header>

        {/* Headline numbers */}
        <section className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-gold/20 to-transparent border border-gold/30 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-gold font-bold">Points</p>
            <p className="font-display font-extrabold text-3xl tabular-nums text-gold">{totalPoints}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Teams</p>
            <p className="font-display font-extrabold text-3xl tabular-nums">{stamps.length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Matches</p>
            <p className="font-display font-extrabold text-3xl tabular-nums">
              {visible.filter((m) => m.finished).length}/{visible.length}
            </p>
          </div>
        </section>

        {/* Next match for your nation */}
        {nextForMe && (
          <section className="bg-gradient-to-br from-stadium to-navy border border-gold/30 rounded-2xl p-5 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Next Up For You</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag src={nextForMe.home.flag} alt={nextForMe.home.name_en} size={28} />
                <span className="font-display font-bold uppercase tracking-tight">{nextForMe.home.name_en}</span>
              </div>
              <span className="text-white/40 text-xs">vs</span>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold uppercase tracking-tight">{nextForMe.away.name_en}</span>
                <Flag src={nextForMe.away.flag} alt={nextForMe.away.name_en} size={28} />
              </div>
            </div>
            <div className="flex justify-between text-[10px] uppercase text-white/50 tracking-wider">
              <span>{nextForMe.kickoff.toUTCString().slice(0, 16)}</span>
              <span>Group {nextForMe.group}</span>
              {nextForMe.stadium?.city_en && <span>{nextForMe.stadium.city_en}</span>}
            </div>
          </section>
        )}

        {/* Top players supporting your team */}
        {primary && stars.length > 0 && (
          <section className="bg-white/5 border border-gold/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Stars Carrying</p>
                <h2 className="font-display font-extrabold text-xl uppercase tracking-tighter italic mt-1">
                  {primary.nation_name}
                </h2>
              </div>
              <span className="text-2xl">⭐</span>
            </div>
            <ul className="space-y-2">
              {stars.map((s) => (
                <li key={s.name} className="flex items-center gap-3 bg-navy/40 rounded-xl p-3">
                  <span className="font-display font-extrabold text-gold w-10 text-xs uppercase">{s.role}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{s.emoji ?? "⚽"} {s.name}</p>
                    {s.club && <p className="text-[10px] text-white/50">{s.club}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Group standings for groups my teams are in */}
        {myGroups.length > 0 && (
          <section className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Your Groups</p>
            {myGroups.map((g) => {
              const table = computeGroupTable(matches, g);
              return (
                <div key={g} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="font-display font-bold uppercase tracking-tight text-sm mb-2">Group {g}</p>
                  <table className="w-full text-xs">
                    <thead className="text-white/40">
                      <tr><th className="text-left">#</th><th className="text-left">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
                    </thead>
                    <tbody>
                      {table.map((row, i) => (
                        <tr key={row.team.id} className={myCodes.has(row.team.fifa_code) ? "text-gold font-bold" : ""}>
                          <td>{i + 1}</td>
                          <td className="flex items-center gap-1 py-1">
                            <Flag src={row.team.flag} alt={row.team.name_en} size={14} />
                            <span className="truncate max-w-[90px]">{row.team.name_en}</span>
                          </td>
                          <td className="text-center tabular-nums">{row.played}</td>
                          <td className="text-center tabular-nums">{row.wins}</td>
                          <td className="text-center tabular-nums">{row.draws}</td>
                          <td className="text-center tabular-nums">{row.losses}</td>
                          <td className="text-center tabular-nums">{row.gd > 0 ? "+" : ""}{row.gd}</td>
                          <td className="text-center font-bold text-gold tabular-nums">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </section>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("mine")}
            className={`flex-1 text-[10px] uppercase font-bold tracking-widest px-3 py-2 rounded-full ${filter === "mine" ? "bg-gold text-navy" : "bg-white/5 text-white/60"}`}
          >
            My Teams ({myCodes.size})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 text-[10px] uppercase font-bold tracking-widest px-3 py-2 rounded-full ${filter === "all" ? "bg-gold text-navy" : "bg-white/5 text-white/60"}`}
          >
            All Fixtures
          </button>
        </div>

        {/* Fixture timeline */}
        <section className="space-y-4">
          {days.length === 0 && (
            <p className="text-center text-sm text-white/50 py-8">
              {filter === "mine" ? "Stamp a nation to see fixtures here." : "Loading fixtures..."}
            </p>
          )}
          {days.map((day) => (
            <div key={day} className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                {new Date(day).toUTCString().slice(0, 11)}
              </p>
              {byDay.get(day)!.map((m) => {
                const mine = myCodes.has(m.home.fifa_code) || myCodes.has(m.away.fifa_code);
                const pts = pointsByMatch.get(m.id) ?? 0;
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl p-3 border ${
                      mine ? "bg-gradient-to-r from-gold/15 to-transparent border-gold/40" : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Flag src={m.home.flag} alt={m.home.name_en} size={18} />
                        <span className={`text-sm truncate ${myCodes.has(m.home.fifa_code) ? "font-bold text-gold" : ""}`}>
                          {m.home.name_en}
                        </span>
                      </div>
                      <span className="font-display font-extrabold tabular-nums text-sm whitespace-nowrap">
                        {m.finished || m.homeScore !== null ? `${m.homeScore ?? 0} - ${m.awayScore ?? 0}` : "vs"}
                      </span>
                      <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <span className={`text-sm truncate ${myCodes.has(m.away.fifa_code) ? "font-bold text-gold" : ""}`}>
                          {m.away.name_en}
                        </span>
                        <Flag src={m.away.flag} alt={m.away.name_en} size={18} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-[10px] uppercase tracking-wider text-white/40">
                      <span>{m.group ? `Group ${m.group}` : m.type.toUpperCase()}</span>
                      {pts !== 0 && (
                        <span className={`font-bold ${pts > 0 ? "text-gold" : "text-japan-red"}`}>
                          {pts > 0 ? "+" : ""}{pts} pts
                        </span>
                      )}
                      <span>{m.finished ? "FT" : m.kickoff.toISOString().slice(11, 16)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
