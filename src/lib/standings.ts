// Group-stage standings + path helpers for WC 2026.
import type { WCMatch, WCTeam } from "./wc2026";

export interface StandingRow {
  team: WCTeam;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export function computeGroupTable(matches: WCMatch[], group: string): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  const ensure = (t: WCTeam) => {
    if (!rows.has(t.id))
      rows.set(t.id, { team: t, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0 });
    return rows.get(t.id)!;
  };
  for (const m of matches) {
    if (m.group !== group || m.type !== "group") continue;
    const h = ensure(m.home);
    const a = ensure(m.away);
    if (!m.finished || m.homeScore == null || m.awayScore == null) continue;
    h.played++; a.played++;
    h.gf += m.homeScore; h.ga += m.awayScore;
    a.gf += m.awayScore; a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) { h.wins++; h.points += 3; a.losses++; }
    else if (m.homeScore < m.awayScore) { a.wins++; a.points += 3; h.losses++; }
    else { h.draws++; a.draws++; h.points++; a.points++; }
  }
  for (const r of rows.values()) r.gd = r.gf - r.ga;
  return Array.from(rows.values()).sort(
    (x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf || x.team.name_en.localeCompare(y.team.name_en),
  );
}

export function nextMatchFor(matches: WCMatch[], teamCode: string): WCMatch | null {
  const now = Date.now();
  return (
    matches.find(
      (m) =>
        !m.finished &&
        m.kickoff.getTime() >= now - 1000 * 60 * 30 &&
        (m.home.fifa_code === teamCode || m.away.fifa_code === teamCode),
    ) ?? null
  );
}

export interface PathInfo {
  group: string;
  table: StandingRow[];
  myRow?: StandingRow;
  nextMatch: WCMatch | null;
  rootFor: { team: WCTeam; reason: string }[];
  advanced: boolean; // finished group stage in top 2
  eliminated: boolean;
}

export function getPath(matches: WCMatch[], teamCode: string): PathInfo | null {
  const team = matches.find((m) => m.home.fifa_code === teamCode)?.home
    ?? matches.find((m) => m.away.fifa_code === teamCode)?.away;
  if (!team) return null;
  const group = team.groups;
  const table = computeGroupTable(matches, group);
  const myRow = table.find((r) => r.team.id === team.id);
  const groupMatches = matches.filter((m) => m.group === group && m.type === "group");
  const allPlayed = groupMatches.every((m) => m.finished);
  const myIdx = table.findIndex((r) => r.team.id === team.id);
  const advanced = allPlayed && myIdx >= 0 && myIdx <= 1;
  const eliminated = allPlayed && myIdx > 2; // top 2 + best thirds in WC2026 — simplified

  // Who to root for: in remaining group matches, identify outcomes that help my team.
  const remaining = groupMatches.filter((m) => !m.finished && m.home.id !== team.id && m.away.id !== team.id);
  const myPts = myRow?.points ?? 0;
  const rootFor: { team: WCTeam; reason: string }[] = [];
  for (const m of remaining) {
    const h = table.find((r) => r.team.id === m.home.id);
    const a = table.find((r) => r.team.id === m.away.id);
    if (!h || !a) continue;
    // We want rivals above/near us to drop points.
    const hiPts = Math.max(h.points, a.points);
    if (hiPts >= myPts) {
      const underdog = h.points <= a.points ? h.team : a.team;
      const favorite = h.points > a.points ? h.team : a.team;
      rootFor.push({
        team: underdog,
        reason: `Beats ${favorite.name_en} → ${favorite.name_en} drops points and your path opens.`,
      });
    }
  }

  return { group, table, myRow, nextMatch: nextMatchFor(matches, teamCode), rootFor, advanced, eliminated };
}
