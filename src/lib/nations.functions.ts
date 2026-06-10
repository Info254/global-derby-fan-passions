import { createServerFn } from "@tanstack/react-start";
import { getNation, NATIONS, type NationSeed } from "./nations-data";

const API_BASE = "https://api-football-v1.p.rapidapi.com/v3";
const API_HOST = "api-football-v1.p.rapidapi.com";

interface ApiFootballFixture {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
  league: { name: string; round: string; logo: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

export interface NationOverview {
  seed: NationSeed;
  teamId?: number;
  logo?: string;
  founded?: number;
  venue?: { name?: string; city?: string };
  upcoming: ApiFootballFixture[];
  recent: ApiFootballFixture[];
  sourceLive: boolean;
}

async function rapid<T>(path: string): Promise<T | null> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": API_HOST },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { response?: T };
    return j.response ?? null;
  } catch {
    return null;
  }
}

export const getNations = createServerFn({ method: "GET" }).handler(async () => {
  return { nations: NATIONS };
});

export const getNationOverview = createServerFn({ method: "GET" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }): Promise<NationOverview | null> => {
    const seed = getNation(data.code);
    if (!seed) return null;

    // Look up team id (cached via seed when known)
    let teamId = seed.apiFootballTeamId;
    let logo: string | undefined;
    let founded: number | undefined;
    let venue: NationOverview["venue"];

    if (process.env.RAPIDAPI_KEY) {
      const teams = await rapid<
        Array<{ team: { id: number; name: string; logo: string; founded?: number }; venue: { name?: string; city?: string } }>
      >(`/teams?search=${encodeURIComponent(seed.name)}&country=${encodeURIComponent(seed.name)}`);
      const match = teams?.find((t) => t.team.name.toLowerCase() === seed.name.toLowerCase()) ?? teams?.[0];
      if (match) {
        teamId = match.team.id;
        logo = match.team.logo;
        founded = match.team.founded;
        venue = match.venue;
      }
    }

    let upcoming: ApiFootballFixture[] = [];
    let recent: ApiFootballFixture[] = [];
    if (teamId && process.env.RAPIDAPI_KEY) {
      upcoming = (await rapid<ApiFootballFixture[]>(`/fixtures?team=${teamId}&next=5`)) ?? [];
      recent = (await rapid<ApiFootballFixture[]>(`/fixtures?team=${teamId}&last=5`)) ?? [];
    }

    return {
      seed,
      teamId,
      logo,
      founded,
      venue,
      upcoming,
      recent,
      sourceLive: !!teamId,
    };
  });
