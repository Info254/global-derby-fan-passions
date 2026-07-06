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
      { name: "description", content: "Your teams, your points, your groups, your fixtures — in one clean view." },
    ],
  }),
  component: ProgressPage,
});

interface MyStamp { nation_code: string; nation_name: string; role: string; }
interface MyPoint { delta: number; match_id: string | null; }

function ProgressPage() {
  const { user } = useAuth();
  const [rawMatches, setRawMatches] = useState<WCMatch[]>([]);
  const [stamps, setStamps] = useState<MyStamp[]>([]);
  const [points, setPoints] = useState<MyPoint[]>([]);
  const [filter, setFilter] = useState<"mine" | "all">("mine");
  const { live } = useLiveScores();
  const matches = useMemo(() => mergeLive(rawMatches, live), [rawMatches, live]);

  useEffect(() => { void getWCData().then((d) => setRawMatches(d.matches)); }, []);

  useEffect(() => {
    if (!user) return;
    void supabase.from("stamps").select("nation_code, nation_name, role").eq("user_id", user.id)
      .then(({ data }) => setStamps((data ?? []) as MyStamp[]));
    void supabase.from("points").select("delta, match_id").eq("user_id", user.id)
      .then(({ data }) => setPoints((data ?? []) as MyPoint[]));
  }, [user]);

  const myCodes = useMemo(() => new Set(stamps.map((s) => s.nation_code)), [stamps]);
  const primary = stamps.find((s) => s.role === "primary");
  const totalPoints = points.reduce((a, p) => a + p.delta, 0);
  const pointsByMatch = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of points) if (p.match_id) m.set(p.match_id, (m.get(p.match_id) ?? 0) + p.delta);
    return m;
  }, [points]);

  const visible = useMemo(() => filter === "all"
    ? matches
    : matches.filter((m) => myCodes.has(m.home.fifa_code) || myCodes.has(m.away.fifa_code)),
    [matches, filter, myCodes]);
  const byDay = useMemo(() => groupMatchesByDay(visible), [visible]);
  const days = Array.from(byDay.keys()).sort();

  const myGroups = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) if (myCodes.has(m.home.fifa_code) || myCodes.has(m.away.fifa_code)) set.add(m.group);
    return Array.from(set).filter(Boolean).sort();
  }, [matches, myCodes]);

  const nextForMe = useMemo(() => {
    const now = Date.now();
    return matches.find((m) => !m.finished && m.kickoff.getTime() >= now
      && (myCodes.has(m.home.fifa_code) || myCodes.has(m.away.fifa_code)));
  }, [matches, myCodes]);

  const mineFinished = visible.filter((m) => m.finished).length;
  const stars = primary ? getStars(primary.nation_code) : [];

  return (
    <AppShell eyebrow="Your Tournament">
      <div className="p-6 space-y-8">
        {/* Hero */}
        <header className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Progress</p>
          <h1 className="font-display font-extrabold text-4xl uppercase tracking-tighter italic leading-none">
            Your Cup
          </h1>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <StatCard label="Points" value={totalPoints} accent />
            <StatCard label="Matches" value={`${mineFinished}/${visible.length || 0}`} />
          </div>
        </header>

        {/* Next up */}
        {nextForMe && (
          <section className="rounded-2xl p-5 bg-gradient-to-br from-stadium to-navy border border-gold/30 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Next Up</p>
              <span className="text-[10px] uppercase text-white/40 tracking-wider">Group {nextForMe.group}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <TeamChip flag={nextForMe.home.flag} name={nextForMe.home.name_en} mine={myCodes.has(nextForMe.home.fifa_code)} />
              <span className="text-white/40 text-xs font-bold">VS</span>
              <TeamChip flag={nextForMe.away.flag} name={nextForMe.away.name_en} mine={myCodes.has(nextForMe.away.fifa_code)} align="right" />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-white/50 text-center">
              {nextForMe.kickoff.toUTCString().slice(0, 22)}
            </p>
          </section>
        )}

        {/* Stars */}
        {primary && stars.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Stars · {primary.nation_name}</p>
              <span className="text-xs text-white/40">Carrying your team</span>
            </div>
            <ul className="space-y-2">
              {stars.map((s) => (
                <li key={s.name} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                  <span className="font-display font-extrabold text-gold text-[10px] uppercase w-8">{s.role}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{s.emoji ?? "⚽"} {s.name}</p>
                    {s.club && <p className="text-[10px] text-white/50 truncate">{s.club}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Standings */}
        {myGroups.length > 0 && (
          <section className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Your Groups</p>
            <div className="space-y-3">
              {myGroups.map((g) => {
                const table = computeGroupTable(matches, g);
                return (
                  <div key={g} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-4 py-2 bg-white/5 border-b border-white/10">
                      <p className="font-display font-bold uppercase tracking-tight text-sm">Group {g}</p>
                    </div>
                    <table className="w-full text-xs">
                      <thead className="text-white/40 uppercase text-[9px] tracking-wider">
                        <tr>
                          <th className="text-left px-3 py-2 w-6">#</th>
                          <th className="text-left py-2">Team</th>
                          <th className="text-center w-7">P</th>
                          <th className="text-center w-7">GD</th>
                          <th className="text-center px-3 w-9">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.map((row, i) => {
                          const mine = myCodes.has(row.team.fifa_code);
                          return (
                            <tr key={row.team.id} className={`border-t border-white/5 ${mine ? "bg-gold/10" : ""}`}>
                              <td className="px-3 py-2 tabular-nums text-white/50">{i + 1}</td>
                              <td className="py-2">
                                <span className={`flex items-center gap-2 ${mine ? "text-gold font-bold" : ""}`}>
                                  <Flag src={row.team.flag} alt={row.team.name_en} size={14} />
                                  <span className="truncate max-w-[110px]">{row.team.name_en}</span>
                                </span>
                              </td>
                              <td className="text-center tabular-nums">{row.played}</td>
                              <td className="text-center tabular-nums">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                              <td className="text-center px-3 font-bold text-gold tabular-nums">{row.points}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Fixtures */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Fixtures</p>
            <div className="flex gap-1 bg-white/5 rounded-full p-1">
              <Toggle active={filter === "mine"} onClick={() => setFilter("mine")}>Mine</Toggle>
              <Toggle active={filter === "all"} onClick={() => setFilter("all")}>All</Toggle>
            </div>
          </div>

          {days.length === 0 && (
            <p className="text-center text-sm text-white/50 py-10">
              {filter === "mine" ? "Stamp a nation to see fixtures here." : "Loading fixtures…"}
            </p>
          )}

          <div className="space-y-5">
            {days.map((day) => (
              <div key={day} className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold sticky top-0 bg-navy/80 backdrop-blur py-1">
                  {new Date(day).toUTCString().slice(0, 11)}
                </p>
                <div className="space-y-2">
                  {byDay.get(day)!.map((m) => {
                    const mine = myCodes.has(m.home.fifa_code) || myCodes.has(m.away.fifa_code);
                    const pts = pointsByMatch.get(m.id) ?? 0;
                    const homeMine = myCodes.has(m.home.fifa_code);
                    const awayMine = myCodes.has(m.away.fifa_code);
                    return (
                      <div key={m.id} className={`rounded-xl p-3 border ${mine ? "bg-gold/5 border-gold/30" : "bg-white/[0.03] border-white/10"}`}>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Flag src={m.home.flag} alt={m.home.name_en} size={16} />
                            <span className={`text-sm truncate ${homeMine ? "font-bold text-gold" : ""}`}>{m.home.name_en}</span>
                          </div>
                          <span className="font-display font-extrabold tabular-nums text-sm whitespace-nowrap px-2 min-w-[52px] text-center">
                            {m.finished || m.homeScore !== null ? `${m.homeScore ?? 0}–${m.awayScore ?? 0}` : "vs"}
                          </span>
                          <div className="flex items-center gap-2 justify-end min-w-0">
                            <span className={`text-sm truncate ${awayMine ? "font-bold text-gold" : ""}`}>{m.away.name_en}</span>
                            <Flag src={m.away.flag} alt={m.away.name_en} size={16} />
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-1.5 text-[10px] uppercase tracking-wider text-white/40">
                          <span>{m.group ? `Grp ${m.group}` : m.type.toUpperCase()}</span>
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
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border ${accent ? "bg-gradient-to-br from-gold/20 to-transparent border-gold/30" : "bg-white/5 border-white/10"}`}>
      <p className={`text-[10px] uppercase tracking-widest font-bold ${accent ? "text-gold" : "text-white/50"}`}>{label}</p>
      <p className={`font-display font-extrabold text-3xl tabular-nums ${accent ? "text-gold" : ""}`}>{value}</p>
    </div>
  );
}

function TeamChip({ flag, name, mine, align = "left" }: { flag: string; name: string; mine: boolean; align?: "left" | "right" }) {
  return (
    <div className={`flex items-center gap-2 flex-1 min-w-0 ${align === "right" ? "justify-end" : ""}`}>
      {align === "left" && <Flag src={flag} alt={name} size={24} />}
      <span className={`font-display font-bold uppercase tracking-tight text-sm truncate ${mine ? "text-gold" : ""}`}>{name}</span>
      {align === "right" && <Flag src={flag} alt={name} size={24} />}
    </div>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full transition-colors ${active ? "bg-gold text-navy" : "text-white/60"}`}
    >
      {children}
    </button>
  );
}
