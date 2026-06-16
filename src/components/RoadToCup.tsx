import type { WCMatch } from "@/lib/wc2026";
import { Flag } from "@/components/Flag";

const STAGES: { key: string; label: string; short: string; threshold: number }[] = [
  { key: "group", label: "Group Stage", short: "GRP", threshold: 100 },
  { key: "r32", label: "Round of 32", short: "R32", threshold: 250 },
  { key: "r16", label: "Round of 16", short: "R16", threshold: 450 },
  { key: "qf", label: "Quarter-Final", short: "QF", threshold: 700 },
  { key: "sf", label: "Semi-Final", short: "SF", threshold: 1000 },
  { key: "final", label: "Final", short: "🏆", threshold: 1400 },
];

export const STAGE_THRESHOLDS = STAGES.map((s) => ({ short: s.short, label: s.label, threshold: s.threshold }));

interface Props {
  matches: WCMatch[];
  nationCode: string;
  nationName: string;
  flag?: string;
  points?: number;
}

export function RoadToCup({ matches, nationCode, nationName, flag, points = 0 }: Props) {
  const teamMatches = matches.filter(
    (m) => m.home.fifa_code === nationCode || m.away.fifa_code === nationCode,
  );

  let reachedIdx = 0;
  let aliveIdx = 0;
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

  const groupMatches = teamMatches.filter((m) => m.type === "group");
  const groupPlayed = groupMatches.filter((m) => m.finished).length;
  const groupTotal = groupMatches.length || 3;
  const groupPct = Math.min(100, (groupPlayed / groupTotal) * 100);

  let status: { label: string; tone: string };
  if (wonFinal) status = { label: "🏆 CHAMPION", tone: "bg-gold text-navy" };
  else if (lostAt != null && lostAt > 0) status = { label: `Out at ${STAGES[lostAt].short}`, tone: "bg-japan-red text-white" };
  else if (reachedIdx === 0 && groupPlayed === groupTotal && aliveIdx === 0) status = { label: "Out in Group", tone: "bg-japan-red text-white" };
  else status = { label: "Still alive", tone: "bg-stadium text-white" };

  const currentIdx = wonFinal ? STAGES.length - 1 : Math.max(reachedIdx, aliveIdx);
  const currentStage = STAGES[currentIdx];
  const nextStage = STAGES[Math.min(currentIdx + 1, STAGES.length - 1)];
  const prevThreshold = currentIdx === 0 ? 0 : STAGES[currentIdx - 1].threshold;
  const stagePts = Math.max(0, points - prevThreshold);
  const stageNeeded = nextStage.threshold - prevThreshold;
  const stagePct = Math.min(100, (stagePts / stageNeeded) * 100);
  const ptsToNext = Math.max(0, nextStage.threshold - points);

  return (
    <section className="relative bg-gradient-to-br from-stadium/40 to-navy border border-gold/30 rounded-2xl p-5 space-y-4 overflow-hidden">
      <div className="absolute -top-4 -right-4 size-24 rounded-full bg-gold/10 blur-2xl" />
      <div className="relative flex justify-between items-start gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Road to the Cup</p>
          <h2 className="font-display font-extrabold text-xl uppercase tracking-tighter italic mt-1 flex items-center gap-2">
            <Flag src={flag} alt={nationName} size={28} /> {nationName}
          </h2>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${status.tone}`}>{status.label}</span>
      </div>

      <div className="relative flex items-center gap-1">
        {STAGES.map((s, i) => {
          const reached = i <= currentIdx;
          const eliminated = lostAt != null && i > lostAt;
          const isCurrent = i === currentIdx && !wonFinal;
          const isFinal = i === STAGES.length - 1;
          return (
            <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-1.5 rounded-full transition-all ${
                  reached && !eliminated
                    ? wonFinal && isFinal
                      ? "bg-gold"
                      : isCurrent
                      ? "bg-gradient-to-r from-stadium to-gold animate-pulse"
                      : "bg-stadium"
                    : eliminated
                    ? "bg-japan-red/40"
                    : "bg-white/10"
                }`}
              />
              <span
                className={`text-[9px] font-bold uppercase tracking-wider ${
                  isCurrent ? "text-gold" : reached && !eliminated ? "text-white" : "text-white/30"
                }`}
              >
                {s.short}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live points progress to next stage */}
      {!wonFinal && lostAt == null && (
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] uppercase tracking-wider">
            <span className="text-white/60">
              <span className="text-gold font-bold">{currentStage.short}</span> → <span className="text-gold font-bold">{nextStage.short}</span>
            </span>
            <span className="tabular-nums text-white/70">
              <span className="text-gold font-bold">{points}</span> / {nextStage.threshold} pts
            </span>
          </div>
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-stadium via-gold to-gold transition-all"
              style={{ width: `${stagePct}%` }}
            />
          </div>
          <p className="text-[10px] text-white/50 text-right">
            {ptsToNext > 0 ? `${ptsToNext} pts to ${nextStage.short}` : `Ready for ${nextStage.short} ✓`}
          </p>
        </div>
      )}

      {currentIdx === 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-white/50 uppercase tracking-wider">
            <span>Group matches</span>
            <span className="tabular-nums">{groupPlayed} / {groupTotal}</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gold transition-all" style={{ width: `${groupPct}%` }} />
          </div>
        </div>
      )}

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
            const oppTeam = isHome ? m.away : m.home;
            return (
              <div key={m.id} className="flex justify-between items-center text-xs bg-white/5 rounded px-2 py-1">
                <span className="text-white/70 truncate flex items-center gap-1">
                  vs <Flag src={oppTeam.flag} alt={oppTeam.name_en} size={14} /> {oppTeam.name_en}
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
