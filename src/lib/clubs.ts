// Club competitions dimension: Premier League + La Liga alongside World Cup 2026.

export type CompetitionId = "WC2026" | "EPL" | "LALIGA";

export interface Competition {
  id: CompetitionId;
  name: string;
  short: string;
  /** API-Football league id (null for the WC dataset, which is file-based). */
  leagueId: number | null;
  season: number;
  accent: string;
}

export const COMPETITIONS: Competition[] = [
  { id: "WC2026", name: "FIFA World Cup 2026", short: "World Cup", leagueId: 1, season: 2026, accent: "text-gold" },
  { id: "EPL", name: "Premier League", short: "Premier League", leagueId: 39, season: 2026, accent: "text-stadium" },
  { id: "LALIGA", name: "La Liga", short: "La Liga", leagueId: 140, season: 2026, accent: "text-bronze" },
];

export function competitionById(id: string): Competition {
  return COMPETITIONS.find((c) => c.id === id) ?? COMPETITIONS[0];
}

export const CLUB_COMPETITIONS = COMPETITIONS.filter((c) => c.id !== "WC2026");

export interface Club {
  code: string;
  name: string;
  competition: CompetitionId;
  crest: string; // emoji-ish fallback badge
}

function crest(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

const EPL_NAMES = [
  "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
  "Burnley", "Chelsea", "Crystal Palace", "Everton", "Fulham",
  "Leeds United", "Liverpool", "Manchester City", "Manchester United",
  "Newcastle United", "Nottingham Forest", "Sunderland", "Tottenham Hotspur",
  "West Ham United", "Wolverhampton Wanderers",
];

const LALIGA_NAMES = [
  "Alaves", "Athletic Club", "Atletico Madrid", "Barcelona", "Celta Vigo",
  "Elche", "Espanyol", "Getafe", "Girona", "Levante",
  "Mallorca", "Osasuna", "Rayo Vallecano", "Real Betis", "Real Madrid",
  "Real Oviedo", "Real Sociedad", "Sevilla", "Valencia", "Villarreal",
];

function build(names: string[], competition: CompetitionId): Club[] {
  return names.map((name) => ({
    code: `${competition}:${name.toLowerCase().replace(/[^a-z]/g, "")}`,
    name,
    competition,
    crest: crest(name),
  }));
}

export const CLUBS: Club[] = [...build(EPL_NAMES, "EPL"), ...build(LALIGA_NAMES, "LALIGA")];

export function clubsFor(competition: CompetitionId): Club[] {
  return CLUBS.filter((c) => c.competition === competition);
}

export function clubByCode(code: string): Club | undefined {
  return CLUBS.find((c) => c.code === code);
}

/** Loose name match between API-Football team names and our club list. */
export function normalizeClubName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(fc|cf|afc|ud|cd|sd|rcd|club|de|deportivo)\b/g, "")
    .replace(/[^a-z]/g, "");
}

const NAME_ALIAS: Record<string, string> = {
  manchestercity: "manchestercity",
  manchesterunited: "manchesterunited",
  tottenham: "tottenhamhotspur",
  spurs: "tottenhamhotspur",
  wolves: "wolverhamptonwanderers",
  westham: "westhamunited",
  newcastle: "newcastleunited",
  nottinghamforest: "nottinghamforest",
  leeds: "leedsunited",
  athleticbilbao: "athleticclub",
  atleticomadrid: "atleticomadrid",
  realbetisbalompie: "realbetis",
  celta: "celtavigo",
  brightonhovealbion: "brighton",
  bournemouth: "bournemouth",
  alaves: "alaves",
};

export function matchClub(apiName: string, competition: CompetitionId): Club | undefined {
  const n = normalizeClubName(apiName);
  const key = NAME_ALIAS[n] ?? n;
  return clubsFor(competition).find((c) => normalizeClubName(c.name) === key);
}
