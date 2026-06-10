import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getNation } from "@/lib/nations-data";
import type { Database } from "@/integrations/supabase/types";

type StampRole = Database["public"]["Enums"]["stamp_role"];

const ROLE_LABEL: Record<StampRole, string> = {
  primary: "Primary",
  second_home: "Second Home",
  underdog: "Underdog",
  family_pick: "Family Pick",
  wildcard: "Wildcard",
  bandwagon: "Bandwagon",
};

interface Stamp {
  id: string;
  role: StampRole;
  nation_code: string;
  nation_name: string;
}
interface HistoryRow {
  id: string;
  user_id: string;
  event: string;
  nation_name: string | null;
  role: StampRole | null;
  created_at: string;
  display_name?: string;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — Global Derby" },
      { name: "description", content: "Your loyalties, your nations, your tournament — the emotional layer of the World Cup." },
      { property: "og:title", content: "Global Derby" },
      { property: "og:description", content: "Every fan has a second team. Track yours." },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, loading } = useAuth();
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [activity, setActivity] = useState<HistoryRow[]>([]);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("stamps")
      .select("id, role, nation_code, nation_name")
      .eq("user_id", user.id)
      .then(({ data }) => setStamps((data ?? []) as Stamp[]));
    void loadActivity();
  }, [user]);

  async function loadActivity() {
    const { data: h } = await supabase
      .from("loyalty_history")
      .select("id, user_id, event, nation_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(8);
    if (!h?.length) return;
    const ids = Array.from(new Set(h.map((r) => r.user_id)));
    const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
    const nameMap = new Map((profs ?? []).map((p) => [p.id, p.display_name]));
    setActivity(h.map((r) => ({ ...r, display_name: nameMap.get(r.user_id) ?? "Someone" })) as HistoryRow[]);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 text-center text-white/40">Loading...</div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="p-6 space-y-8">
          <section className="bg-gradient-to-br from-japan-red via-[#80001e] to-navy rounded-2xl p-8 border border-white/20 text-center space-y-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Global Derby</p>
            <h1 className="font-display font-extrabold text-4xl uppercase tracking-tighter italic">
              The World Cup
              <br />Through the Eyes of Fans
            </h1>
            <p className="text-sm text-white/70">Pick your nation. Support beyond borders. Every fan has a second team.</p>
            <Link to="/auth" className="inline-block bg-gold text-navy font-display font-black px-6 py-3 rounded-lg uppercase tracking-tight text-sm">
              Claim Your Passport
            </Link>
          </section>
          <Link to="/nations" className="block bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-xs uppercase tracking-widest text-gold font-bold">Browse Nations</p>
            <p className="text-sm text-white/60 mt-1">Explore every World Cup team without signing up.</p>
          </Link>
        </div>
      </AppShell>
    );
  }

  const primary = stamps.find((s) => s.role === "primary");
  const primaryNation = primary ? getNation(primary.nation_code) : undefined;

  return (
    <AppShell>
      <div className="p-6 space-y-8">
        <section className="relative">
          <div className="absolute -top-3 -right-2 bg-japan-red text-white text-[10px] font-bold px-2.5 py-1 rounded skew-x-[-12deg] z-10 shadow-lg">
            PRIMARY NATION
          </div>
          <div className="bg-gradient-to-br from-japan-red via-[#80001e] to-navy rounded-2xl p-6 border border-white/20 relative overflow-hidden">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{primaryNation?.flag ?? "🏳️"}</span>
              <div>
                <h1 className="font-display font-extrabold text-3xl uppercase tracking-tighter italic">
                  {primary?.nation_name ?? "Pick Your Primary"}
                </h1>
                <p className="text-white/80 text-sm font-medium">
                  {primaryNation?.nickname ?? "Stamp your first nation to begin"}
                  {primaryNation?.rank && ` · #${primaryNation.rank} World Rank`}
                </p>
              </div>
            </div>
            <Link to="/passport" className="inline-block mt-4 text-[10px] uppercase tracking-widest text-gold font-bold">
              {primary ? "Manage Passport →" : "Add a Stamp →"}
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-bold uppercase tracking-tight">Loyalty Passport</h2>
            <span className="text-xs text-gold font-semibold uppercase">
              {stamps.length} Stamp{stamps.length === 1 ? "" : "s"}
            </span>
          </div>
          {stamps.length === 0 ? (
            <Link to="/passport" className="block text-center bg-white/5 border border-dashed border-white/15 rounded-xl py-8 text-sm text-white/60">
              No stamps yet. Tap to add your first.
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {stamps.map((s) => {
                const n = getNation(s.nation_code);
                return (
                  <div key={s.id} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <p className="text-[10px] text-white/40 uppercase mb-2">{ROLE_LABEL[s.role]}</p>
                    <p className="font-display font-bold text-lg uppercase">{s.nation_name}</p>
                    {n && <span className="text-xl">{n.flag}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-display font-bold uppercase tracking-tight">Circle Activity</h2>
          {activity.length === 0 ? (
            <p className="text-xs text-white/40">Join a circle to see loyalty shifts here.</p>
          ) : (
            <div className="bg-stadium/20 border border-white/5 rounded-2xl p-4 space-y-3">
              {activity.map((a) => (
                <div key={a.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-white/10 grid place-items-center font-bold">
                      {a.display_name?.slice(0, 1).toUpperCase()}
                    </div>
                    <p className="font-semibold">
                      {a.display_name}{" "}
                      <span className="text-white/40 font-normal">{a.event.replace("_", " ")}</span>{" "}
                      {a.nation_name}
                    </p>
                  </div>
                  <span className="text-[10px] text-white/40">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <Link to="/matchday" className="block p-6 bg-gradient-to-t from-gold/20 to-transparent border border-gold/30 rounded-2xl text-center space-y-2">
          <p className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase italic">Matchday</p>
          <p className="font-display font-extrabold text-xl uppercase italic">Open Live Companion</p>
        </Link>
      </div>
    </AppShell>
  );
}
