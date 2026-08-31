// SINGLE SOURCE OF TRUTH for verified World Cup 2026 knockout results.
// Every surface (fixtures dataset, Progress page, points sync, scheduled
// backfill) reads from here so scores and points can never drift apart.

export interface VerifiedResult {
  id: string;
  type: string;
  group: string;
  matchday: number;
  kickoff: string;
  homeCode: string;
  awayCode: string;
  homeScore: number | null;
  awayScore: number | null;
  finished: boolean;
  stadiumId?: string;
  source: string;
}

/** When this verified result set was last reconciled against official sources. */
export const RESULTS_UPDATED_AT = "2026-07-20T06:00:00Z";
/** Human-readable provenance shown in the app's freshness indicator. */
export const RESULTS_SOURCE = "FIFA official results (cross-checked: ESPN, BBC)";
/** Bump when scoring rules change so the backfill re-evaluates historic points. */
export const RESULTS_VERSION = "v1";

export const VERIFIED_RESULTS: VerifiedResult[] = [
  {
    id: "101",
    type: "sf",
    group: "SF",
    matchday: 7,
    kickoff: "2026-07-14T21:00:00Z",
    homeCode: "FRA",
    awayCode: "ESP",
    homeScore: 0,
    awayScore: 2,
    finished: true,
    stadiumId: "4",
    source: "ESPN/BBC/Al Jazeera verified semifinal result, 14 Jul 2026",
  },
  {
    id: "102",
    type: "sf",
    group: "SF",
    matchday: 7,
    kickoff: "2026-07-15T19:00:00Z",
    homeCode: "ENG",
    awayCode: "ARG",
    homeScore: 1,
    awayScore: 2,
    finished: true,
    stadiumId: "7",
    source: "FIFA verified semifinal result, 15 Jul 2026",
  },
  {
    id: "103",
    type: "third",
    group: "THIRD",
    matchday: 8,
    kickoff: "2026-07-18T22:00:00Z",
    homeCode: "FRA",
    awayCode: "ENG",
    homeScore: 4,
    awayScore: 6,
    finished: true,
    source: "FIFA verified third-place result, 18 Jul 2026",
  },
  {
    id: "104",
    type: "final",
    group: "FINAL",
    matchday: 9,
    kickoff: "2026-07-19T19:00:00Z",
    homeCode: "ESP",
    awayCode: "ARG",
    homeScore: 1,
    awayScore: 0,
    finished: true,
    stadiumId: "11",
    source: "FIFA verified final result, 19 Jul 2026 — Spain champions after extra time",
  },
];

/** Results that are complete enough to be scored. */
export const SCOREABLE_RESULTS = VERIFIED_RESULTS.filter(
  (r) => r.finished && r.homeScore !== null && r.awayScore !== null,
);

export interface ScoringStamp {
  role: string;
  nation_code: string;
}

export interface PointInsert {
  user_id: string;
  match_id: string;
  source: string;
  delta: number;
  reason: string;
}

/**
 * Deterministic outcome scoring shared by the on-demand sync and the
 * scheduled backfill. `existingReasons` makes it idempotent.
 */
export function computeOutcomeInserts(
  userId: string,
  stamps: ScoringStamp[],
  existingReasons: Set<string | null>,
): PointInsert[] {
  const inserts: PointInsert[] = [];
  if (!stamps.length) return inserts;

  for (const outcome of SCOREABLE_RESULTS) {
    const involved = stamps.filter(
      (s) => s.nation_code === outcome.homeCode || s.nation_code === outcome.awayCode,
    );
    if (!involved.length) continue;

    // Two of your teams facing each other: no winner, small solidarity credit.
    if (involved.length > 1) {
      const codes = involved.map((s) => s.nation_code).sort().join("_");
      const reason = `split_allegiance_${outcome.id}_${codes}`;
      if (!existingReasons.has(reason)) {
        inserts.push({ user_id: userId, match_id: outcome.id, source: "outcome", delta: 5, reason });
      }
      continue;
    }

    const stamp = involved[0];
    const isHome = stamp.nation_code === outcome.homeCode;
    const myScore = (isHome ? outcome.homeScore : outcome.awayScore) as number;
    const oppScore = (isHome ? outcome.awayScore : outcome.homeScore) as number;
    const result = myScore > oppScore ? "win" : myScore < oppScore ? "loss" : "draw";
    const primary = stamp.role === "primary";
    const delta =
      result === "win" ? (primary ? 30 : 15) : result === "draw" ? (primary ? 10 : 5) : primary ? -10 : -5;
    const reason = `${result}_${stamp.role}_${stamp.nation_code}_${outcome.id}`;
    if (!existingReasons.has(reason)) {
      inserts.push({ user_id: userId, match_id: outcome.id, source: "outcome", delta, reason });
    }
  }
  return inserts;
}

export const VERIFIED_MATCH_IDS = VERIFIED_RESULTS.map((r) => r.id);
