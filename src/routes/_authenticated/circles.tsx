import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Circle {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
}

interface Member {
  user_id: string;
  display_name: string;
  primary_nation_code: string | null;
  primary_nation_name: string | null;
}

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const Route = createFileRoute("/_authenticated/circles")({
  head: () => ({
    meta: [
      { title: "Circles — Global Derby" },
      { name: "description", content: "Family and friend circles — vote, predict, react." },
    ],
  }),
  component: CirclesPage,
});

function CirclesPage() {
  const { user } = useAuth();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [active, setActive] = useState<Circle | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) void loadCircles();
  }, [user]);

  useEffect(() => {
    if (active) void loadMembers(active.id);
  }, [active]);

  async function loadCircles() {
    const { data } = await supabase.from("circles").select("*").order("created_at");
    const list = (data ?? []) as Circle[];
    setCircles(list);
    if (!active && list.length) setActive(list[0]);
  }

  async function loadMembers(circleId: string) {
    const { data: ms } = await supabase
      .from("circle_members")
      .select("user_id")
      .eq("circle_id", circleId);
    const ids = (ms ?? []).map((m) => m.user_id);
    if (!ids.length) return setMembers([]);
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name, primary_nation_code, primary_nation_name")
      .in("id", ids);
    setMembers(
      (profs ?? []).map((p) => ({
        user_id: p.id,
        display_name: p.display_name,
        primary_nation_code: p.primary_nation_code,
        primary_nation_name: p.primary_nation_name,
      })),
    );
  }

  async function createCircle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !user) return;
    const code = randomCode();
    const { data, error } = await supabase
      .from("circles")
      .insert({ name: name.trim(), invite_code: code, created_by: user.id })
      .select()
      .single();
    if (error || !data) return setError(error?.message ?? "Failed");
    await supabase.from("circle_members").insert({ circle_id: data.id, user_id: user.id });
    setName("");
    void loadCircles();
  }

  async function joinCircle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!joinCode.trim() || !user) return;
    const { data: c } = await supabase
      .from("circles")
      .select("id")
      .eq("invite_code", joinCode.trim().toUpperCase())
      .maybeSingle();
    if (!c) return setError("Invite code not found");
    const { error } = await supabase.from("circle_members").insert({ circle_id: c.id, user_id: user.id });
    if (error && !error.message.includes("duplicate")) return setError(error.message);
    setJoinCode("");
    void loadCircles();
  }

  // Breakdown of primary nations among members
  const breakdown = Object.entries(
    members.reduce<Record<string, { name: string; count: number }>>((acc, m) => {
      const k = m.primary_nation_code ?? "—";
      const n = m.primary_nation_name ?? "Undecided";
      acc[k] = { name: n, count: (acc[k]?.count ?? 0) + 1 };
      return acc;
    }, {}),
  ).sort((a, b) => b[1].count - a[1].count);

  return (
    <AppShell eyebrow="Derby Circles">
      <div className="p-6 space-y-6">
        {circles.length === 0 ? (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-extrabold text-3xl uppercase tracking-tighter italic">
                Start Your Circle
              </h1>
              <p className="text-sm text-white/60 mt-2">Create a family group or join one with an invite code.</p>
            </div>
            <form onSubmit={createCircle} className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-4">
              <label className="text-[10px] uppercase tracking-widest text-gold font-bold">Create a Circle</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="The Mwangi Family" className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-sm" />
              <button className="w-full bg-gold text-navy font-display font-black py-2 rounded-lg uppercase tracking-tight text-sm">Create</button>
            </form>
            <form onSubmit={joinCircle} className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-4">
              <label className="text-[10px] uppercase tracking-widest text-stadium font-bold">Join with Code</label>
              <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123" className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-sm tracking-widest" />
              <button className="w-full bg-stadium text-white font-display font-black py-2 rounded-lg uppercase tracking-tight text-sm">Join</button>
            </form>
            {error && <p className="text-japan-red text-xs">{error}</p>}
          </div>
        ) : (
          <>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gold font-bold">Your Circle</p>
              <h1 className="font-display font-extrabold text-3xl uppercase tracking-tighter italic">
                {active?.name}
              </h1>
              <p className="text-sm text-white/60 mt-1">
                {members.length} members · Invite code{" "}
                <span className="font-mono text-gold tracking-widest">{active?.invite_code}</span>
              </p>
            </div>

            {circles.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {circles.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActive(c)}
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      active?.id === c.id ? "bg-gold text-navy border-gold" : "bg-white/5 border-white/10"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            <section className="bg-stadium/20 border border-white/10 rounded-2xl p-5 space-y-4">
              <h2 className="font-display font-bold uppercase tracking-tight text-sm">Support Breakdown</h2>
              {breakdown.length === 0 ? (
                <p className="text-xs text-white/50">No primary nations picked yet.</p>
              ) : (
                <div className="space-y-3">
                  {breakdown.map(([code, b]) => (
                    <div key={code} className="flex items-center gap-3">
                      <span className="font-semibold text-sm w-32 truncate">{b.name}</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gold" style={{ width: `${(b.count / members.length) * 100}%` }} />
                      </div>
                      <span className="font-display font-bold text-sm w-4 text-right">{b.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <h2 className="font-display font-bold uppercase tracking-tight text-sm">Members</h2>
              {members.map((m) => (
                <div key={m.user_id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-white/10 grid place-items-center text-xs font-bold">
                      {m.display_name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="font-semibold">{m.display_name}</span>
                  </div>
                  <span className="text-xs text-white/50">{m.primary_nation_name ?? "—"}</span>
                </div>
              ))}
            </section>

            <details className="bg-white/5 border border-white/10 rounded-xl p-4">
              <summary className="cursor-pointer text-xs uppercase tracking-widest font-bold text-white/60">
                Manage circles
              </summary>
              <div className="mt-4 space-y-3">
                <form onSubmit={createCircle} className="space-y-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New circle name" className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-sm" />
                  <button className="w-full bg-gold text-navy font-display font-black py-2 rounded-lg uppercase text-xs">Create New</button>
                </form>
                <form onSubmit={joinCircle} className="space-y-2">
                  <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Join with code" className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-sm tracking-widest" />
                  <button className="w-full bg-stadium text-white font-display font-black py-2 rounded-lg uppercase text-xs">Join</button>
                </form>
                {error && <p className="text-japan-red text-xs">{error}</p>}
              </div>
            </details>
          </>
        )}
      </div>
    </AppShell>
  );
}
