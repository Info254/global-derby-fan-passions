import { createServerFn } from "@tanstack/react-start";

// Live World Cup 2026 scores via API-Football (RapidAPI).
// League 1 = FIFA World Cup, season 2026.
export interface LiveFixture {
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string; // NS, 1H, HT, 2H, ET, P, FT, AET, PEN, LIVE...
  minute: number | null;
  kickoffISO: string;
}

let CACHE: { ts: number; data: LiveFixture[] } | null = null;
const TTL = 5 * 60 * 1000; // keep live knockout matches fresh without hammering the API

export const getLiveScores = createServerFn({ method: "GET" }).handler(
  async (): Promise<LiveFixture[]> => {
    if (CACHE && Date.now() - CACHE.ts < TTL) return CACHE.data;
    const key = process.env.RAPIDAPI_KEY;
    if (!key) return [];
    try {
      const res = await fetch(
        "https://api-football-v1.p.rapidapi.com/v3/fixtures?league=1&season=2026",
        {
          headers: {
            "x-rapidapi-key": key,
            "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
          },
        },
      );
      if (!res.ok) return CACHE?.data ?? [];
      const json = (await res.json()) as {
        response?: Array<{
          fixture: { date: string; status: { short: string; elapsed: number | null } };
          teams: { home: { name: string }; away: { name: string } };
          goals: { home: number | null; away: number | null };
        }>;
      };
      const data: LiveFixture[] = (json.response ?? []).map((f) => ({
        homeName: f.teams.home.name,
        awayName: f.teams.away.name,
        homeScore: f.goals.home,
        awayScore: f.goals.away,
        status: f.fixture.status.short,
        minute: f.fixture.status.elapsed,
        kickoffISO: f.fixture.date,
      }));
      CACHE = { ts: Date.now(), data };
      return data;
    } catch (e) {
      console.error("live-scores fetch failed", e);
      return CACHE?.data ?? [];
    }
  },
);
