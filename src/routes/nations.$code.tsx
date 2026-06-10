import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { CONTINENT_META, getNation } from "@/lib/nations-data";
import { getNationOverview } from "@/lib/nations.functions";

const nationQuery = (code: string) =>
  queryOptions({
    queryKey: ["nation", code],
    queryFn: () => getNationOverview({ data: { code } }),
    staleTime: 5 * 60 * 1000,
  });

export const Route = createFileRoute("/nations/$code")({
  loader: ({ context, params }) => {
    if (!getNation(params.code)) throw notFound();
    return context.queryClient.ensureQueryData(nationQuery(params.code));
  },
  head: ({ params }) => {
    const n = getNation(params.code);
    return {
      meta: [
        { title: `${n?.name ?? params.code} — Global Derby` },
        { name: "description", content: `${n?.name} at the 2026 World Cup. Rank, fixtures, and tournament journey on Global Derby.` },
        { property: "og:title", content: `${n?.name} — Global Derby` },
        { property: "og:description", content: `Follow ${n?.name} (${n?.nickname ?? "World Cup"}) through the 2026 tournament.` },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <AppShell eyebrow="Nations">
      <div className="p-6 text-center text-sm text-white/60">Couldn't load this nation. {error.message}</div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell eyebrow="Nations">
      <div className="p-6 text-center text-sm text-white/60">
        Nation not found.{" "}
        <Link to="/nations" className="text-gold underline">See all</Link>
      </div>
    </AppShell>
  ),
  component: NationPage,
});

function NationPage() {
  const { code } = Route.useParams();
  const { data } = useSuspenseQuery(nationQuery(code));
  if (!data) return null;
  const { seed, upcoming, recent, sourceLive, founded, venue } = data;
  const cont = CONTINENT_META[seed.continent];

  return (
    <AppShell eyebrow={cont.full}>
      <div className="p-6 space-y-6">
        <Link to="/nations" className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white">
          ← All Nations
        </Link>

        <div className="bg-gradient-to-br from-stadium to-navy border border-gold/30 rounded-2xl p-6 space-y-3 relative overflow-hidden">
          <p className={`text-[10px] uppercase tracking-[0.3em] font-bold ${cont.accent}`}>{cont.label}</p>
          <div className="flex items-center gap-4">
            <span className="text-6xl">{seed.flag}</span>
            <div>
              <h1 className="font-display font-extrabold text-4xl uppercase tracking-tighter italic">{seed.name}</h1>
              {seed.nickname && <p className="text-sm text-white/70">{seed.nickname}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-center">
            <div>
              <p className="text-[10px] text-white/40 uppercase">FIFA Rank</p>
              <p className="font-display font-extrabold text-2xl text-gold">#{seed.rank ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase">Founded</p>
              <p className="font-display font-extrabold text-2xl">{founded ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase">Continent</p>
              <p className="font-display font-extrabold text-2xl">{cont.label}</p>
            </div>
          </div>
          {venue?.name && (
            <p className="text-xs text-white/50 pt-2">Home venue · {venue.name}{venue.city ? `, ${venue.city}` : ""}</p>
          )}
        </div>

        {!sourceLive && (
          <p className="text-[10px] uppercase tracking-widest text-white/40 text-center">
            Live fixtures unavailable — showing tournament profile only.
          </p>
        )}

        {upcoming.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display font-bold uppercase tracking-tight">Next Up</h2>
            <div className="space-y-2">
              {upcoming.map((f) => (
                <div key={f.fixture.id} className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm flex justify-between items-center">
                  <div>
                    <p className="font-bold">{f.teams.home.name} vs {f.teams.away.name}</p>
                    <p className="text-[10px] text-white/40 uppercase">{f.league.name} · {f.league.round}</p>
                  </div>
                  <p className="text-xs text-gold">{new Date(f.fixture.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {recent.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display font-bold uppercase tracking-tight">Recent</h2>
            <div className="space-y-2">
              {recent.map((f) => (
                <div key={f.fixture.id} className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm flex justify-between items-center">
                  <div>
                    <p className="font-bold">{f.teams.home.name} vs {f.teams.away.name}</p>
                    <p className="text-[10px] text-white/40 uppercase">{f.league.name}</p>
                  </div>
                  <p className="font-display font-bold text-gold">
                    {f.goals.home ?? "—"} : {f.goals.away ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <Link
          to="/passport"
          className="block w-full text-center bg-gold text-navy font-display font-black py-3 rounded-lg uppercase tracking-tight text-sm hover:brightness-110 transition"
        >
          Stamp {seed.name} into Your Passport
        </Link>
      </div>
    </AppShell>
  );
}
