// Star players carrying each nation's hopes at WC 2026.
// Static editorial dataset — extend freely. Keys are FIFA 3-letter codes.

export interface StarPlayer {
  name: string;
  role: "ST" | "AM" | "MF" | "DF" | "GK" | "WG";
  club?: string;
  emoji?: string; // a small vibe icon
}

export const TOP_PLAYERS: Record<string, StarPlayer[]> = {
  FRA: [
    { name: "Kylian Mbappé", role: "ST", club: "Real Madrid", emoji: "⚡" },
    { name: "Aurélien Tchouaméni", role: "MF", club: "Real Madrid" },
    { name: "Ousmane Dembélé", role: "WG", club: "PSG" },
  ],
  ENG: [
    { name: "Jude Bellingham", role: "AM", club: "Real Madrid", emoji: "👑" },
    { name: "Harry Kane", role: "ST", club: "Bayern" },
    { name: "Bukayo Saka", role: "WG", club: "Arsenal" },
  ],
  ESP: [
    { name: "Lamine Yamal", role: "WG", club: "Barcelona", emoji: "✨" },
    { name: "Rodri", role: "MF", club: "Man City" },
    { name: "Pedri", role: "MF", club: "Barcelona" },
  ],
  POR: [
    { name: "Cristiano Ronaldo", role: "ST", club: "Al-Nassr", emoji: "🐐" },
    { name: "Bruno Fernandes", role: "AM", club: "Man United" },
    { name: "Bernardo Silva", role: "MF", club: "Man City" },
  ],
  ARG: [
    { name: "Lionel Messi", role: "AM", club: "Inter Miami", emoji: "🐐" },
    { name: "Lautaro Martínez", role: "ST", club: "Inter" },
    { name: "Enzo Fernández", role: "MF", club: "Chelsea" },
  ],
  BRA: [
    { name: "Vinícius Jr.", role: "WG", club: "Real Madrid", emoji: "🪩" },
    { name: "Rodrygo", role: "WG", club: "Real Madrid" },
    { name: "Endrick", role: "ST", club: "Real Madrid" },
  ],
  GER: [
    { name: "Florian Wirtz", role: "AM", club: "Bayern", emoji: "🎯" },
    { name: "Jamal Musiala", role: "AM", club: "Bayern" },
    { name: "Kai Havertz", role: "ST", club: "Arsenal" },
  ],
  NED: [
    { name: "Virgil van Dijk", role: "DF", club: "Liverpool" },
    { name: "Cody Gakpo", role: "WG", club: "Liverpool" },
    { name: "Frenkie de Jong", role: "MF", club: "Barcelona" },
  ],
  BEL: [
    { name: "Kevin De Bruyne", role: "AM", club: "Napoli", emoji: "🎩" },
    { name: "Romelu Lukaku", role: "ST", club: "Napoli" },
  ],
  CIV: [
    { name: "Sébastien Haller", role: "ST", club: "Utrecht", emoji: "🐘" },
    { name: "Franck Kessié", role: "MF", club: "Al-Ahli" },
    { name: "Simon Adingra", role: "WG", club: "Brighton" },
  ],
  MAR: [
    { name: "Achraf Hakimi", role: "DF", club: "PSG", emoji: "🦁" },
    { name: "Brahim Díaz", role: "AM", club: "Real Madrid" },
  ],
  SEN: [
    { name: "Sadio Mané", role: "WG", club: "Al-Nassr", emoji: "🦁" },
    { name: "Édouard Mendy", role: "GK", club: "Al-Ahli" },
  ],
  EGY: [{ name: "Mohamed Salah", role: "WG", club: "Liverpool", emoji: "🔥" }],
  NGA: [{ name: "Victor Osimhen", role: "ST", club: "Galatasaray", emoji: "🐆" }],
  USA: [
    { name: "Christian Pulisic", role: "WG", club: "Milan", emoji: "🇺🇸" },
    { name: "Weston McKennie", role: "MF", club: "Juventus" },
  ],
  MEX: [{ name: "Santiago Giménez", role: "ST", club: "Milan", emoji: "🌶️" }],
  CAN: [{ name: "Alphonso Davies", role: "DF", club: "Real Madrid", emoji: "🍁" }],
  JPN: [
    { name: "Takefusa Kubo", role: "WG", club: "Real Sociedad" },
    { name: "Wataru Endo", role: "MF", club: "Liverpool" },
  ],
  KOR: [{ name: "Son Heung-min", role: "WG", club: "Al-Hilal", emoji: "🐯" }],
  AUS: [{ name: "Mathew Ryan", role: "GK", club: "Roma" }],
  IRN: [{ name: "Mehdi Taremi", role: "ST", club: "Inter" }],
  SAU: [{ name: "Salem Al-Dawsari", role: "WG", club: "Al-Hilal" }],
  URU: [
    { name: "Federico Valverde", role: "MF", club: "Real Madrid" },
    { name: "Darwin Núñez", role: "ST", club: "Al-Hilal" },
  ],
  CRO: [{ name: "Luka Modrić", role: "MF", club: "Milan", emoji: "🎼" }],
  SUI: [{ name: "Granit Xhaka", role: "MF", club: "Leverkusen" }],
  NOR: [{ name: "Erling Haaland", role: "ST", club: "Man City", emoji: "🤖" }],
  SWE: [{ name: "Alexander Isak", role: "ST", club: "Liverpool" }],
  TUR: [{ name: "Arda Güler", role: "AM", club: "Real Madrid" }],
  ECU: [{ name: "Moisés Caicedo", role: "MF", club: "Chelsea" }],
  PAR: [{ name: "Antonio Sanabria", role: "ST", club: "Cremonese" }],
  COL: [{ name: "Luis Díaz", role: "WG", club: "Bayern", emoji: "🌴" }],
};

export function getStars(code: string): StarPlayer[] {
  return TOP_PLAYERS[code] ?? [];
}
