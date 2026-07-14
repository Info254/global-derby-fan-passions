// Free, open-source FIFA World Cup 2026 dataset.
// Source: https://github.com/rezarahiminia/worldcup2026 (ISC license).
// We fetch raw JSON files from GitHub — no API key required.

const BASE = "https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main";

export interface WCTeam {
  id: string;
  name_en: string;
  flag: string;
  fifa_code: string;
  iso2: string;
  groups: string;
}

export interface WCStadium {
  id: string;
  name_en?: string;
  city_en?: string;
  country_en?: string;
}

export interface WCMatchRaw {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  group: string;
  matchday: string;
  local_date: string; // "MM/DD/YYYY HH:mm"
  stadium_id: string;
  finished: string; // "TRUE" | "FALSE"
  time_elapsed: string;
  type: string; // group | r32 | r16 | qf | sf | final
}

export interface WCMatch {
  id: string;
  kickoff: Date;
  group: string;
  matchday: number;
  type: string;
  finished: boolean;
  home: WCTeam;
  away: WCTeam;
  homeScore: number | null;
  awayScore: number | null;
  stadium?: WCStadium;
  label: string;
  source?: string;
}

interface VerifiedResult {
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

const VERIFIED_RESULTS: VerifiedResult[] = [
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
    homeScore: null,
    awayScore: null,
    finished: false,
    stadiumId: "7",
    source: "FIFA match centre semifinal fixture, 15 Jul 2026",
  },
  {
    id: "104",
    type: "final",
    group: "FINAL",
    matchday: 9,
    kickoff: "2026-07-19T19:00:00Z",
    homeCode: "ESP",
    awayCode: "TBD",
    homeScore: null,
    awayScore: null,
    finished: false,
    stadiumId: "11",
    source: "Winner of semifinal 101 advanced to the final",
  },
];

const TBD_TEAM: WCTeam = {
  id: "tbd",
  name_en: "TBD",
  flag: "",
  fifa_code: "TBD",
  iso2: "",
  groups: "",
};

interface Cache {
  matches?: WCMatch[];
  teams?: WCTeam[];
  stadiums?: WCStadium[];
  ts?: number;
}
const CACHE: Cache = {};
const TTL = 1000 * 60 * 30; // 30 min

function parseLocalDate(s: string): Date {
  // "06/11/2026 13:00" — interpret as UTC-ish; good enough for sorting.
  const [d, t] = s.split(" ");
  const [mm, dd, yyyy] = d.split("/").map(Number);
  const [hh, mi] = (t ?? "00:00").split(":").map(Number);
  return new Date(Date.UTC(yyyy, mm - 1, dd, hh, mi));
}

async function loadJSON<T>(file: string): Promise<T> {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`WC2026 fetch failed: ${file}`);
  return res.json() as Promise<T>;
}

export async function getWCData(): Promise<{ matches: WCMatch[]; teams: WCTeam[]; stadiums: WCStadium[] }> {
  if (CACHE.matches && CACHE.ts && Date.now() - CACHE.ts < TTL) {
    return { matches: CACHE.matches, teams: CACHE.teams!, stadiums: CACHE.stadiums! };
  }
  const [teamsRaw, matchesRaw, stadiumsRaw] = await Promise.all([
    loadJSON<WCTeam[]>("football.teams.json"),
    loadJSON<WCMatchRaw[]>("football.matches.json"),
    loadJSON<WCStadium[]>("football.stadiums.json").catch(() => [] as WCStadium[]),
  ]);
  const teamById = new Map(teamsRaw.map((t) => [t.id, t]));
  const teamByCode = new Map(teamsRaw.map((t) => [t.fifa_code, t]));
  const stadiumById = new Map(stadiumsRaw.map((s) => [s.id, s]));
  const matches: WCMatch[] = matchesRaw
    .map((m) => {
      const home = teamById.get(m.home_team_id);
      const away = teamById.get(m.away_team_id);
      if (!home || !away) return null;
      return {
        id: m.id,
        kickoff: parseLocalDate(m.local_date),
        group: m.group,
        matchday: Number(m.matchday) || 0,
        type: m.type,
        finished: m.finished === "TRUE",
        home,
        away,
        homeScore: m.home_score === "0" && !m.finished ? null : Number(m.home_score),
        awayScore: m.away_score === "0" && !m.finished ? null : Number(m.away_score),
        stadium: stadiumById.get(m.stadium_id),
        label: `${home.name_en} vs ${away.name_en}`,
      } as WCMatch;
    })
    .filter((x): x is WCMatch => !!x)
    .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());

  const byId = new Map(matches.map((m) => [m.id, m]));
  for (const verified of VERIFIED_RESULTS) {
    const home = verified.homeCode === "TBD" ? TBD_TEAM : teamByCode.get(verified.homeCode);
    const away = verified.awayCode === "TBD" ? TBD_TEAM : teamByCode.get(verified.awayCode);
    if (!home || !away) continue;
    const existing = byId.get(verified.id);
    const patched: WCMatch = {
      id: verified.id,
      kickoff: new Date(verified.kickoff),
      group: verified.group,
      matchday: verified.matchday,
      type: verified.type,
      finished: verified.finished,
      home,
      away,
      homeScore: verified.homeScore,
      awayScore: verified.awayScore,
      stadium: stadiumById.get(verified.stadiumId ?? "") ?? existing?.stadium,
      label: `${home.name_en} vs ${away.name_en}`,
      source: verified.source,
    };
    if (existing) Object.assign(existing, patched);
    else matches.push(patched);
  }

  matches.sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());

  CACHE.matches = matches;
  CACHE.teams = teamsRaw;
  CACHE.stadiums = stadiumsRaw;
  CACHE.ts = Date.now();
  return { matches, teams: teamsRaw, stadiums: stadiumsRaw };
}

export function groupMatchesByDay(matches: WCMatch[]): Map<string, WCMatch[]> {
  const out = new Map<string, WCMatch[]>();
  for (const m of matches) {
    const key = m.kickoff.toISOString().slice(0, 10);
    if (!out.has(key)) out.set(key, []);
    out.get(key)!.push(m);
  }
  return out;
}
