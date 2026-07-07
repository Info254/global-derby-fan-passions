import { createFileRoute, Link } from "@tanstack/react-router";
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

  const now = Date.now();
  const finishedAll = useMemo(
    () => matches.filter((m) => m.finished && m.homeScore != null && m.awayScore != null),
    [matches],
  );
  const upcomingAll = useMemo(
    () => matches.filter((m) => !m.finished && m.kickoff.getTime() >= now - 1000 * 60 * 60 * 2),
    [matches, now],
  );

  // My team record (only across truly finished matches with scores).
  const myRecord = useMemo(() => {
    let w = 0, d = 0, l = 0, gf = 0, ga = 0;
    for (const m of finishedAll) {
      const homeMine = myCodes.has(m.home.fifa_code);
      const awayMine = myCodes.has(m.away.fifa_code);
      if (!homeMine && !awayMine) continue;
      const my = homeMine ? m.homeScore! : m.awayScore!;
      const opp = homeMine ? m.awayScore! : m.homeScore!;
      gf += my; ga += opp;
      if (my > opp) w++; else if (my < opp) l++; else d++;
    }
    return { w, d, l, gf, ga, played: w + d + l };
  }, [finishedAll, myCodes]);

  const visible = useMemo(() => filter === "all"
    ? matches
    : matches.filter((m) => myCodes.has(m.home.fifa_code) || myCodes.has(m.away.fifa_code)),
    [matches, filter, myCodes]);

  const visibleUpcoming = visible.filter((m) => !m.finished && m.kickoff.getTime() >= now - 1000 * 60 * 60 * 2);
  const visibleFinished = visible.filter((m) => m.finished && m.homeScore != null);

  const upcomingByDay = useMemo(() => groupMatchesByDay(visibleUpcoming), [visibleUpcoming]);
  const days = Array.from(upcomingByDay.keys()).sort();

  const myGroups = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) if (myCodes.has(m.home.fifa_code) || myCodes.has(m.away.fifa_code)) set.add(m.group);
    return Array.from(set).filter(Boolean).sort();
  }, [matches, myCodes]);

  const nextForMe = useMemo(() => upcomingAll.find(
    (m) => myCodes.has(m.home.fifa_code) || myCodes.has(m.away.fifa_code),
  ), [upcomingAll, myCodes]);

  const stars = primary ? getStars(primary.nation_code) : [];

  const hasStamps = stamps.length > 0;
  const tournamentLive = finishedAll.length > 0 || live.some((f) => ["1H","2H","HT","ET","P","LIVE"].includes(f.status));

  return (
    <AppShell eyebrow="Your Tournament">
      <div className="p-6 space-y-8">
        {/* Hero */}
        <header className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Progress</p>
          <h1 className="font-display font-extrabold text-4xl uppercase tracking-tighter italic leading-none">
            Your Cup
          </h1>

          {!hasStamps ? (
            <Link to="/passport" className="block rounded-2xl p-4 bg-gradient-to-br from-gold/20 to-transparent border border-gold/30">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gold">Get Started</p>
              <p className="text-sm mt-1">Stamp a nation in your Passport to see your groups, fixtures and points.</p>
            </Link>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <StatCard label="Points" value={totalPoints} accent />
                <StatCard label="Games Played" value={myRecord.played} />
              </div>
              {myRecord.played > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat label="W" value={myRecord.w} tone="gold" />
                  <MiniStat label="D" value={myRecord.d} />
                  <MiniStat label="L" value={myRecord.l} tone="red" />
                </div>
              ) : (
                <p className="text-[11px] text-white/50 italic">
                  {tournamentLive ? "No results in for your teams yet." : "Tournament results appear once matches kick off."}
                </p>
              )}
            </>
          )}
        </header>

        {/* Next up */}
        {hasStamps && nextForMe && (
          <section className="rounded-2xl p-5 bg-gradient-to-br from-stadium to-navy border border-gold/30 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Next Up</p>
              <span className="text-[10px] uppercase text-white/40 tracking-wider">
                {nextForMe.group ? `Group ${nextForMe.group}` : nextForMe.type.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <TeamChip flag={nextForMe.home.flag} name={nextForMe.home.name_en} mine={myCodes.has(nextForMe.home.fifa_code)} />
              <span className="text-white/40 text-xs font-bold">VS</span>
              <TeamChip flag={nextForMe.away.flag} name={nextForMe.away.name_en} mine={myCodes.has(nextForMe.away.fifa_code)} align="right" />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-white/50 text-center">
              {formatKickoff(nextForMe.kickoff)}
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

        {/* Recent results for my teams */}
        {hasStamps && visibleFinished.length > 0 && (
          <section className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Recent Results</p>
            <div className="space-y-2">
              {visibleFinished.slice(-5).reverse().map((m) => (
                <MatchRow key={m.id} m={m} myCodes={myCodes} pts={pointsByMatch.get(m.id) ?? 0} />
              ))}
            </div>
          </section>
        )}

        {/* Standings — only render groups that have at least one played match */}
        {hasStamps && myGroups.length > 0 && (
          <section className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Your Groups</p>
            <div className="space-y-3">
              {myGroups.map((g) => {
                const table = computeGroupTable(matches, g);
                const anyPlayed = table.some((r) => r.played > 0);
                return (
                  <div key={g} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between">
                      <p className="font-display font-bold uppercase tracking-tight text-sm">Group {g}</p>
                      {!anyPlayed && <span className="text-[10px] uppercase text-white/40 tracking-wider">No matches played</span>}
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

        {/* Upcoming fixtures */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Upcoming Fixtures</p>
            {hasStamps && (
              <div className="flex gap-1 bg-white/5 rounded-full p-1">
                <Toggle active={filter === "mine"} onClick={() => setFilter("mine")}>Mine</Toggle>
                <Toggle active={filter === "all"} onClick={() => setFilter("all")}>All</Toggle>
              </div>
            )}
          </div>

          <p className="text-[10px] uppercase tracking-widest text-white/40">
            {visibleUpcoming.length} match{visibleUpcoming.length === 1 ? "" : "es"} scheduled
            {filter === "mine" && hasStamps ? " for your teams" : ""}
          </p>

          {days.length === 0 && (
            <p className="text-center text-sm text-white/50 py-10">
              {filter === "mine" && hasStamps ? "No upcoming matches for your teams." : "No upcoming fixtures."}
            </p>
          )}

          <div className="space-y-5">
            {days.slice(0, 14).map((day) => (
              <div key={day} className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold sticky top-0 bg-navy/80 backdrop-blur py-1">
                  {formatDay(day)}
                </p>
                <div className="space-y-2">
                  {upcomingByDay.get(day)!.map((m) => (
                    <MatchRow key={m.id} m={m} myCodes={myCodes} pts={pointsByMatch.get(m.id) ?? 0} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function MatchRow({ m, myCodes, pts }: { m: WCMatch; myCodes: Set<string>; pts: number }) {
  const mine = myCodes.has(m.home.fifa_code) || myCodes.has(m.away.fifa_code);
  const homeMine = myCodes.has(m.home.fifa_code);
  const awayMine = myCodes.has(m.away.fifa_code);
  const showScore = m.finished && m.homeScore != null && m.awayScore != null;
  return (
    <div className={`rounded-xl p-3 border ${mine ? "bg-gold/5 border-gold/30" : "bg-white/[0.03] border-white/10"}`}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Flag src={m.home.flag} alt={m.home.name_en} size={16} />
          <span className={`text-sm truncate ${homeMine ? "font-bold text-gold" : ""}`}>{m.home.name_en}</span>
        </div>
        <span className="font-display font-extrabold tabular-nums text-sm whitespace-nowrap px-2 min-w-[52px] text-center">
          {showScore ? `${m.homeScore}–${m.awayScore}` : "vs"}
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
        <span>{showScore ? "FT" : formatTime(m.kickoff)}</span>
      </div>
    </div>
  );
}

function formatDay(day: string): string {
  const d = new Date(day + "T12:00:00Z");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function formatKickoff(d: Date): string {
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border ${accent ? "bg-gradient-to-br from-gold/20 to-transparent border-gold/30" : "bg-white/5 border-white/10"}`}>
      <p className={`text-[10px] uppercase tracking-widest font-bold ${accent ? "text-gold" : "text-white/50"}`}>{label}</p>
      <p className={`font-display font-extrabold text-3xl tabular-nums ${accent ? "text-gold" : ""}`}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: "gold" | "red" }) {
  const color = tone === "gold" ? "text-gold" : tone === "red" ? "text-japan-red" : "text-white";
  return (
    <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-center">
      <p className="text-[9px] uppercase tracking-widest text-white/50 font-bold">{label}</p>
      <p className={`font-display font-extrabold text-2xl tabular-nums ${color}`}>{value}</p>
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
