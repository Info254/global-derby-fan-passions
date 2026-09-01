import { createServerFn } from "@tanstack/react-start";

// Club competition fixtures (Premier League, La Liga) via API-Football.
// Cached for 24h per server instance to keep upstream cost near zero.
export interface ClubFixture {
  competition: "EPL" | "LALIGA";
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string; // NS, 1H, HT, 2H, FT...
  minute: number | null;
  kickoffISO: string;
}

const LEAGUES: Array<{ id: number; competition: "EPL" | "LALIGA" }> = [
  { id: 39, competition: "EPL" },
  { id: 140, competition: "LALIGA" },
];

let CACHE: { ts: number; data: ClubFixture[] } | null = null;
const TTL = 24 * 60 * 60 * 1000;

interface ApiFixture {
  fixture: { date: string; status: { short: string; elapsed: number | null } };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
}

export const getClubScores = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClubFixture[]> => {
    if (CACHE && Date.now() - CACHE.ts < TTL) return CACHE.data;
    const key = process.env["RAPIDAPI_KEY"];
    if (!key) return [];

    const headers = {
      "x-rapidapi-key": key,
      "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
    };

    async function pull(leagueId: number, window: "last" | "next"): Promise<ApiFixture[]> {
      const url = `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${leagueId}&${window}=20`;
      const res = await fetch(url, { headers });
      if (!res.ok) return [];
      const json = (await res.json()) as { response?: ApiFixture[] };
      return json.response ?? [];
    }

    try {
      const data: ClubFixture[] = [];
      for (const league of LEAGUES) {
        const [past, upcoming] = await Promise.all([
          pull(league.id, "last"),
          pull(league.id, "next"),
        ]);
        for (const f of [...past, ...upcoming]) {
          data.push({
            competition: league.competition,
            homeName: f.teams.home.name,
            awayName: f.teams.away.name,
            homeScore: f.goals.home,
            awayScore: f.goals.away,
            status: f.fixture.status.short,
            minute: f.fixture.status.elapsed,
            kickoffISO: f.fixture.date,
          });
        }
      }
      data.sort((a, b) => a.kickoffISO.localeCompare(b.kickoffISO));
      CACHE = { ts: Date.now(), data };
      return data;
    } catch (e) {
      console.error("club-scores fetch failed", e);
      return CACHE?.data ?? [];
    }
  },
);
