import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getClubScores, type ClubFixture } from "@/lib/club-scores.functions";
import { clubByCode, competitionById, matchClub, type CompetitionId } from "@/lib/clubs";

export interface ClubStamp {
  role: string;
  nation_code: string;
  nation_name: string;
  competition: string;
}

const LIVE = ["1H", "2H", "HT", "ET", "P", "LIVE"];
const DONE = ["FT", "AET", "PEN"];

export function ClubWatch({ stamps }: { stamps: ClubStamp[] }) {
  const call = useServerFn(getClubScores);
  const [fixtures, setFixtures] = useState<ClubFixture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void call()
      .then((d) => { if (!cancelled) setFixtures(d); })
      .catch((e) => console.warn("club scores unavailable", e))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [call]);

  const rows = useMemo(() => {
    return stamps.map((s) => {
      const comp = s.competition as CompetitionId;
      const club = clubByCode(s.nation_code);
      const mine = fixtures.filter((f) => {
        if (f.competition !== comp) return false;
        const home = matchClub(f.homeName, comp);
        const away = matchClub(f.awayName, comp);
        return home?.code === s.nation_code || away?.code === s.nation_code;
      });
      const played = mine.filter((f) => DONE.includes(f.status));
      const live = mine.find((f) => LIVE.includes(f.status));
      const next = mine.find((f) => !DONE.includes(f.status) && !LIVE.includes(f.status));
      return { stamp: s, club, comp, last: played.at(-1), live, next, playedCount: played.length };
    });
  }, [stamps, fixtures]);

  if (stamps.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Club Watch</p>
        <span className="text-xs text-white/40">
          {loading ? "Loading fixtures…" : fixtures.length ? "Live feed" : "Feed unavailable"}
        </span>
      </div>
      <div className="space-y-2">
        {rows.map(({ stamp, club, comp, last, live, next, playedCount }) => (
          <div key={`${stamp.competition}-${stamp.role}`} className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-white/40">
                  {competitionById(comp).short} · {stamp.role.replace("_", " ")}
                </p>
                <p className="font-display font-extrabold text-xl uppercase tracking-tighter italic truncate">
                  {stamp.nation_name}
                </p>
              </div>
              <span className="shrink-0 size-10 rounded-full border-2 border-gold/40 grid place-items-center text-[10px] font-black text-gold">
                {club?.crest ?? "⚽"}
              </span>
            </div>

            {live && (
              <p className="text-sm font-display font-bold text-japan-red">
                🔴 LIVE {live.minute ? `${live.minute}'` : ""} — {live.homeName} {live.homeScore ?? 0}–{live.awayScore ?? 0} {live.awayName}
              </p>
            )}

            {last && (
              <p className="text-xs text-white/70">
                Last: {last.homeName} <span className="font-bold text-gold tabular-nums">{last.homeScore}–{last.awayScore}</span> {last.awayName}
              </p>
            )}

            {next && (
              <p className="text-xs text-white/60">
                Next: {next.homeName} vs {next.awayName} ·{" "}
                {new Date(next.kickoffISO).toLocaleString(undefined, {
                  weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            )}

            <p className="text-[10px] uppercase tracking-wider text-white/35">
              {playedCount} tracked {playedCount === 1 ? "match" : "matches"} in feed
              {!last && !next && !live ? " · no fixtures found yet" : ""}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
