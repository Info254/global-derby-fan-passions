// 2026 FIFA World Cup nations (qualified + presumptive) grouped by confederation.
// Used as the canonical list; live match/standings data comes from API-Football.

export type Continent = "CAF" | "UEFA" | "AFC" | "CONMEBOL" | "CONCACAF" | "OFC";

export interface NationSeed {
  code: string; // ISO 3166-1 alpha-3
  name: string;
  flag: string; // emoji
  continent: Continent;
  nickname?: string;
  rank?: number;
  apiFootballTeamId?: number; // API-Football team id (filled when known)
}

export const CONTINENT_META: Record<Continent, { label: string; full: string; accent: string }> = {
  CAF: { label: "CAF", full: "Africa", accent: "text-gold" },
  UEFA: { label: "UEFA", full: "Europe", accent: "text-silver" },
  AFC: { label: "AFC", full: "Asia", accent: "text-japan-red" },
  CONMEBOL: { label: "CONMEBOL", full: "South America", accent: "text-bronze" },
  CONCACAF: { label: "CONCACAF", full: "North America", accent: "text-stadium" },
  OFC: { label: "OFC", full: "Oceania", accent: "text-white/70" },
};

export const NATIONS: NationSeed[] = [
  // UEFA
  { code: "FRA", name: "France", flag: "🇫🇷", continent: "UEFA", nickname: "Les Bleus", rank: 2 },
  { code: "ENG", name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", continent: "UEFA", nickname: "Three Lions", rank: 4 },
  { code: "ESP", name: "Spain", flag: "🇪🇸", continent: "UEFA", nickname: "La Roja", rank: 1 },
  { code: "POR", name: "Portugal", flag: "🇵🇹", continent: "UEFA", nickname: "Seleção", rank: 6 },
  { code: "GER", name: "Germany", flag: "🇩🇪", continent: "UEFA", nickname: "Die Mannschaft", rank: 9 },
  { code: "NED", name: "Netherlands", flag: "🇳🇱", continent: "UEFA", nickname: "Oranje", rank: 7 },
  { code: "ITA", name: "Italy", flag: "🇮🇹", continent: "UEFA", nickname: "Azzurri", rank: 10 },
  { code: "BEL", name: "Belgium", flag: "🇧🇪", continent: "UEFA", nickname: "Red Devils", rank: 8 },
  { code: "CRO", name: "Croatia", flag: "🇭🇷", continent: "UEFA", nickname: "Vatreni", rank: 11 },
  { code: "SUI", name: "Switzerland", flag: "🇨🇭", continent: "UEFA", nickname: "Nati", rank: 17 },
  { code: "DEN", name: "Denmark", flag: "🇩🇰", continent: "UEFA", nickname: "Danish Dynamite", rank: 19 },
  { code: "AUT", name: "Austria", flag: "🇦🇹", continent: "UEFA", rank: 22 },
  // CONMEBOL
  { code: "ARG", name: "Argentina", flag: "🇦🇷", continent: "CONMEBOL", nickname: "La Albiceleste", rank: 3 },
  { code: "BRA", name: "Brazil", flag: "🇧🇷", continent: "CONMEBOL", nickname: "Seleção", rank: 5 },
  { code: "URU", name: "Uruguay", flag: "🇺🇾", continent: "CONMEBOL", nickname: "La Celeste", rank: 14 },
  { code: "COL", name: "Colombia", flag: "🇨🇴", continent: "CONMEBOL", nickname: "Los Cafeteros", rank: 12 },
  { code: "ECU", name: "Ecuador", flag: "🇪🇨", continent: "CONMEBOL", rank: 24 },
  { code: "PAR", name: "Paraguay", flag: "🇵🇾", continent: "CONMEBOL", rank: 38 },
  // CONCACAF (hosts)
  { code: "USA", name: "USA", flag: "🇺🇸", continent: "CONCACAF", nickname: "Stars & Stripes", rank: 16 },
  { code: "MEX", name: "Mexico", flag: "🇲🇽", continent: "CONCACAF", nickname: "El Tri", rank: 18 },
  { code: "CAN", name: "Canada", flag: "🇨🇦", continent: "CONCACAF", nickname: "Canucks", rank: 31 },
  // AFC
  { code: "JPN", name: "Japan", flag: "🇯🇵", continent: "AFC", nickname: "Blue Samurai", rank: 18 },
  { code: "KOR", name: "South Korea", flag: "🇰🇷", continent: "AFC", nickname: "Taegeuk Warriors", rank: 23 },
  { code: "IRN", name: "Iran", flag: "🇮🇷", continent: "AFC", nickname: "Team Melli", rank: 20 },
  { code: "AUS", name: "Australia", flag: "🇦🇺", continent: "AFC", nickname: "Socceroos", rank: 26 },
  { code: "KSA", name: "Saudi Arabia", flag: "🇸🇦", continent: "AFC", nickname: "Green Falcons", rank: 56 },
  { code: "QAT", name: "Qatar", flag: "🇶🇦", continent: "AFC", rank: 60 },
  // CAF
  { code: "MAR", name: "Morocco", flag: "🇲🇦", continent: "CAF", nickname: "Atlas Lions", rank: 13 },
  { code: "SEN", name: "Senegal", flag: "🇸🇳", continent: "CAF", nickname: "Lions of Teranga", rank: 21 },
  { code: "NGA", name: "Nigeria", flag: "🇳🇬", continent: "CAF", nickname: "Super Eagles", rank: 27 },
  { code: "EGY", name: "Egypt", flag: "🇪🇬", continent: "CAF", nickname: "Pharaohs", rank: 32 },
  { code: "CIV", name: "Côte d'Ivoire", flag: "🇨🇮", continent: "CAF", nickname: "Les Éléphants", rank: 35 },
  // OFC
  { code: "NZL", name: "New Zealand", flag: "🇳🇿", continent: "OFC", nickname: "All Whites", rank: 95 },
];

export function getNation(code: string): NationSeed | undefined {
  return NATIONS.find((n) => n.code.toUpperCase() === code.toUpperCase());
}

export function nationsByContinent(): Record<Continent, NationSeed[]> {
  return NATIONS.reduce(
    (acc, n) => {
      (acc[n.continent] ||= []).push(n);
      return acc;
    },
    {} as Record<Continent, NationSeed[]>,
  );
}
