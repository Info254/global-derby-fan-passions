import type { WCMatch } from "@/lib/wc2026";

const STAGES: { key: string; label: string; short: string }[] = [
  { key: "group", label: "Group Stage", short: "GRP" },
  { key: "r32", label: "Round of 32", short: "R32" },
  { key: "r16", label: "Round of 16", short: "R16" },
  { key: "qf", label: "Quarter-Final", short: "QF" },
  { key: "sf", label: "Semi-Final", short: "SF" },
  { key: "final", label: "Final", short: "🏆" },
];

interface Props {
  matches: WCMatch[];
  nationCode: string;
  nationName: string;
  flag?: string;
}

export function RoadToCup({ matches, nationCode, nationName, flag }: Props) {
  const teamMatches = matches.filter(
    (m) => m.home.fifa_code === nationCode || m.away.fifa_code === nationCode,
  );

  // Highest stage index the team has played in (or is scheduled in)
  let reachedIdx = 0;
  let aliveIdx = 0; // last stage where team did NOT lose
  let wonFinal = false;
  let lostAt: number | null = null;

  for (const m of teamMatches) {
    const idx = STAGES.findIndex((s) => s.key === m.type);
    if (idx < 0) continue;
    if (idx > reachedIdx) reachedIdx = idx;
    if (m.finished && m.homeScore != null && m.awayScore != null) {
      const isHome = m.home.fifa_code === nationCode;
      const myScore = isHome ? m.homeScore : m.awayScore;
      const oppScore = isHome ? m.awayScore : m.homeScore;
      if (m.type !== "group" && myScore < oppScore) {
        if (lostAt == null || idx < lostAt) lostAt = idx;
      } else if (myScore >= oppScore) {
        if (idx > aliveIdx) aliveIdx = idx;
        if (m.type === "final" && myScore > oppScore) wonFinal = true;
      }
    } else if (idx > aliveIdx) {
      aliveIdx = idx;
    }
  }

  // Group stage progression — count wins toward "advanced"
  const groupMatches = teamMatches.filter((m) => m.type === "group");
  const groupPlayed = groupMatches.filter((m) => m.finished).length;
  const groupTotal = groupMatches.length || 3;
  const groupPct = Math.min(100, (groupPlayed / groupTotal) * 100);

  // Status badge
  let status: { label: string; tone: string };
  if (wonFinal) status = { label: "🏆 CHAMPION", tone: "bg-gold text-navy" };
  else if (lostAt != null && lostAt > 0) status = { label: `Out at ${STAGES[lostAt].short}`, tone: "bg-japan-red text-white" };
  else if (reachedIdx === 0 && groupPlayed === groupTotal && aliveIdx === 0) status = { label: "Out in Group", tone: "bg-japan-red text-white" };
  else status = { label: "Still alive", tone: "bg-stadium text-white" };

  const currentIdx = wonFinal ? STAGES.length - 1 : Math.max(reachedIdx, aliveIdx);

  return (
    <section className="bg-gradient-to-br from-stadium/30 to-navy border border-gold/30 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-start gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Road to the Cup</p>
          <h2 className="font-display font-extrabold text-xl uppercase tracking-tighter italic mt-1">
            {flag ?? "🏳️"} {nationName}
          </h2>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${status.tone}`}>{status.label}</span>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1">
        {STAGES.map((s, i) => {
          const reached = i <= currentIdx;
          const eliminated = lostAt != null && i > lostAt;
          const isFinal = i === STAGES.length - 1;
          return (
            <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-1.5 rounded-full ${
                  reached && !eliminated
                    ? wonFinal && isFinal
                      ? "bg-gold"
                      : "bg-stadium"
                    : eliminated
                    ? "bg-japan-red/40"
                    : "bg-white/10"
                }`}
              />
              <span
                className={`text-[9px] font-bold uppercase tracking-wider ${
                  reached && !eliminated ? "text-white" : "text-white/30"
                }`}
              >
                {s.short}
              </span>
            </div>
          );
        })}
      </div>

      {/* Group progress sub-bar */}
      {currentIdx === 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-white/50 uppercase tracking-wider">
            <span>Group matches</span>
            <span className="tabular-nums">{groupPlayed} / {groupTotal}</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gold transition-all" style={{ width: `${groupPct}%` }} />
          </div>
        </div>
      )}

      {/* Recent results — last 3 finished + next unfinished */}
      <div className="space-y-1">
        {teamMatches
          .filter((m) => m.finished)
          .slice(-3)
          .map((m) => {
            const isHome = m.home.fifa_code === nationCode;
            const my = isHome ? m.homeScore : m.awayScore;
            const opp = isHome ? m.awayScore : m.homeScore;
            const won = (my ?? 0) > (opp ?? 0);
            const drew = my === opp;
            return (
              <div key={m.id} className="flex justify-between items-center text-xs bg-white/5 rounded px-2 py-1">
                <span className="text-white/70 truncate">
                  vs {isHome ? m.away.flag : m.home.flag} {isHome ? m.away.name_en : m.home.name_en}
                </span>
                <span className={`font-display font-bold tabular-nums ${won ? "text-gold" : drew ? "text-white/60" : "text-japan-red"}`}>
                  {my}–{opp} {won ? "W" : drew ? "D" : "L"}
                </span>
              </div>
            );
          })}
      </div>
    </section>
  );
}
