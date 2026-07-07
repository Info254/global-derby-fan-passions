import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getLiveScores, type LiveFixture } from "./live-scores.functions";
import type { WCMatch } from "./wc2026";

// Rough alias map so api-football names line up with the WC2026 dataset.
const ALIAS: Record<string, string> = {
  usa: "unitedstates",
  us: "unitedstates",
  usmnt: "unitedstates",
  koreasouth: "southkorea",
  koreadprsouth: "southkorea",
  koreadpr: "northkorea",
  republicofireland: "ireland",
  irrepublic: "ireland",
  czechrepublic: "czechia",
  ivorycoast: "cotedivoire",
  bosnia: "bosniaandherzegovina",
  bosniaherzegovina: "bosniaandherzegovina",
  capeverde: "caboverde",
};

function norm(s: string): string {
  const k = s.toLowerCase().replace(/[^a-z]/g, "");
  return ALIAS[k] ?? k;
}

export function useLiveScores(): { live: LiveFixture[]; loading: boolean } {
  const call = useServerFn(getLiveScores);
  const [live, setLive] = useState<LiveFixture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const data = await call();
        if (!cancelled) setLive(data);
      } catch (e) {
        console.warn("live scores unavailable", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void tick();
    // Refresh once per 24 hours to keep API costs down.
    const t = setInterval(tick, 24 * 60 * 60 * 1000);
    return () => { cancelled = true; clearInterval(t); };

  }, [call]);

  return { live, loading };
}

export function mergeLive(matches: WCMatch[], live: LiveFixture[]): WCMatch[] {
  if (live.length === 0) return matches;
  // Index live by "home|away" normalized
  const idx = new Map<string, LiveFixture>();
  for (const f of live) idx.set(`${norm(f.homeName)}|${norm(f.awayName)}`, f);

  return matches.map((m) => {
    const key = `${norm(m.home.name_en)}|${norm(m.away.name_en)}`;
    const f = idx.get(key);
    if (!f) return m;
    const finished = ["FT", "AET", "PEN"].includes(f.status);
    const live = ["1H", "2H", "HT", "ET", "P", "LIVE"].includes(f.status);
    // Only overwrite scores when the match has actually started; ignore NS/TBD/PST so
    // future fixtures don't appear as fake "0-0".
    if (!finished && !live) return m;
    return {
      ...m,
      homeScore: f.homeScore,
      awayScore: f.awayScore,
      finished,
    };
  });
}

export function liveStatusFor(match: WCMatch | null, live: LiveFixture[]): LiveFixture | null {
  if (!match) return null;
  const key = `${norm(match.home.name_en)}|${norm(match.away.name_en)}`;
  return live.find((f) => `${norm(f.homeName)}|${norm(f.awayName)}` === key) ?? null;
}
