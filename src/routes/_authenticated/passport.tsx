import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { NATIONS } from "@/lib/nations-data";
import type { Database } from "@/integrations/supabase/types";

type StampRole = Database["public"]["Enums"]["stamp_role"];

const ROLE_META: Record<StampRole, { label: string; color: string }> = {
  primary: { label: "Primary Hope", color: "border-japan-red" },
  second_home: { label: "Second Home", color: "border-stadium" },
  underdog: { label: "The Underdog", color: "border-bronze" },
  family_pick: { label: "Family Pick", color: "border-gold" },
  wildcard: { label: "Wildcard", color: "border-silver" },
  bandwagon: { label: "Bandwagon", color: "border-white/40" },
};

interface Stamp {
  id: string;
  role: StampRole;
  nation_code: string;
  nation_name: string;
  created_at: string;
  note: string | null;
}

interface HistoryRow {
  id: string;
  event: string;
  role: StampRole | null;
  nation_code: string | null;
  nation_name: string | null;
  previous_nation_code: string | null;
  created_at: string;
}

export const Route = createFileRoute("/_authenticated/passport")({
  head: () => ({
    meta: [
      { title: "Passport — Global Derby" },
      { name: "description", content: "Your fandom passport. Every allegiance, stamped and saved." },
    ],
  }),
  component: PassportPage,
});

function PassportPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newRole, setNewRole] = useState<StampRole>("primary");
  const [newNationCode, setNewNationCode] = useState<string>(NATIONS[0].code);
  const [profileName, setProfileName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    void refresh();
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfileName(data?.display_name ?? "Fan"));
  }, [user]);

  async function refresh() {
    const [s, h] = await Promise.all([
      supabase.from("stamps").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase
        .from("loyalty_history")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setStamps((s.data ?? []) as Stamp[]);
    setHistory((h.data ?? []) as HistoryRow[]);
  }

  async function addStamp(e: React.FormEvent) {
    e.preventDefault();
    const nation = NATIONS.find((n) => n.code === newNationCode);
    if (!nation || !user) return;
    await supabase
      .from("stamps")
      .upsert(
        { user_id: user.id, role: newRole, nation_code: nation.code, nation_name: nation.name },
        { onConflict: "user_id,role" },
      );
    if (newRole === "primary") {
      await supabase
        .from("profiles")
        .update({ primary_nation_code: nation.code, primary_nation_name: nation.name })
        .eq("id", user.id);
    }
    setShowAdd(false);
    void refresh();
  }

  async function removeStamp(id: string) {
    await supabase.from("stamps").delete().eq("id", id);
    void refresh();
  }

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/" });
  }

  return (
    <AppShell eyebrow="Fandom Passport">
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-br from-stadium to-navy border border-gold/30 rounded-2xl p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-4 right-4 size-20 border-2 border-gold/30 rounded-full flex items-center justify-center rotate-12">
            <span className="text-[8px] text-gold/60 uppercase tracking-tighter font-bold text-center leading-tight">
              World<br />Cup<br />2026
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Global Derby Passport</p>
          <div>
            <p className="text-[10px] uppercase text-white/40">Owner</p>
            <h1 className="font-display font-extrabold text-3xl uppercase tracking-tighter italic">
              {profileName || "Fan"}
            </h1>
          </div>
          <div className="pt-2 border-t border-white/10">
            <p className="text-[10px] uppercase text-white/40">Tournament</p>
            <p className="font-display font-bold text-lg">FIFA World Cup 2026</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold uppercase tracking-tight">Allegiance Stamps</h2>
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full bg-gold text-navy"
          >
            {showAdd ? "Cancel" : "+ Add Stamp"}
          </button>
        </div>

        {showAdd && (
          <form onSubmit={addStamp} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <div>
              <label className="text-[10px] uppercase text-white/40">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as StampRole)}
                className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 mt-1 text-sm"
              >
                {Object.entries(ROLE_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-white/40">Nation</label>
              <select
                value={newNationCode}
                onChange={(e) => setNewNationCode(e.target.value)}
                className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 mt-1 text-sm"
              >
                {NATIONS.map((n) => (
                  <option key={n.code} value={n.code}>{n.flag} {n.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full bg-gold text-navy font-display font-black py-2 rounded-lg uppercase tracking-tight text-sm">
              Stamp It
            </button>
          </form>
        )}

        <div className="space-y-3">
          {stamps.length === 0 && (
            <p className="text-sm text-white/50 text-center py-8">No stamps yet. Pick your first nation above.</p>
          )}
          {stamps.map((s) => (
            <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase text-white/40">{ROLE_META[s.role].label}</p>
                <p className="font-display font-extrabold text-2xl uppercase tracking-tighter italic mt-1">
                  {s.nation_name}
                </p>
                <p className="text-[10px] uppercase text-white/60 mt-1">
                  Stamped · {new Date(s.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`size-16 rounded-full border-4 ${ROLE_META[s.role].color} flex items-center justify-center rotate-[-8deg]`}>
                  <span className="text-[8px] font-bold text-white/70 uppercase tracking-tighter text-center leading-tight">
                    Verified<br />Fan
                  </span>
                </div>
                <button onClick={() => removeStamp(s.id)} className="text-[10px] text-white/40 hover:text-japan-red">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <section className="space-y-3 pt-4">
          <h2 className="font-display font-bold uppercase tracking-tight">Loyalty History</h2>
          {history.length === 0 && <p className="text-xs text-white/40">No loyalty changes yet.</p>}
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold uppercase tracking-wider text-gold">{h.event.replace("_", " ")}</span>{" "}
                  <span className="text-white/70">
                    {h.nation_name}
                    {h.previous_nation_code ? ` (was ${h.previous_nation_code})` : ""}
                    {h.role ? ` · ${h.role.replace("_", " ")}` : ""}
                  </span>
                </div>
                <span className="text-[10px] text-white/40">
                  {new Date(h.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>

        <button onClick={signOut} className="w-full text-center text-xs text-white/40 hover:text-white py-4">
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
