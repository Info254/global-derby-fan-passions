import { supabase } from "@/integrations/supabase/client";

export interface PointRow {
  id: string;
  user_id: string;
  circle_id: string | null;
  match_id: string | null;
  source: string;
  delta: number;
  reason: string | null;
  created_at: string;
}

export async function getMyTotal(userId: string): Promise<number> {
  const { data } = await supabase.from("points").select("delta").eq("user_id", userId);
  return (data ?? []).reduce((s, r) => s + (r.delta ?? 0), 0);
}

export async function getMyMatchTotal(userId: string, matchId: string): Promise<number> {
  const { data } = await supabase
    .from("points").select("delta").eq("user_id", userId).eq("match_id", matchId);
  return (data ?? []).reduce((s, r) => s + (r.delta ?? 0), 0);
}

export interface LeaderRow { user_id: string; display_name: string; total: number }

export async function getCircleLeaderboard(circleId: string, matchId?: string): Promise<LeaderRow[]> {
  let q = supabase.from("points").select("user_id, delta").eq("circle_id", circleId);
  if (matchId) q = q.eq("match_id", matchId);
  const { data } = await q;
  const totals = new Map<string, number>();
  for (const r of data ?? []) totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + (r.delta ?? 0));
  // also count stamp points (no circle_id) for circle members
  const { data: members } = await supabase.from("circle_members").select("user_id").eq("circle_id", circleId);
  const ids = (members ?? []).map((m) => m.user_id);
  if (!matchId && ids.length) {
    const { data: stamps } = await supabase
      .from("points").select("user_id, delta").is("circle_id", null).in("user_id", ids);
    for (const r of stamps ?? []) totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + (r.delta ?? 0));
  }
  const userIds = Array.from(totals.keys());
  if (!userIds.length) return [];
  const { data: profs } = await supabase
    .from("profiles").select("id, display_name").in("id", userIds);
  const nameMap = new Map((profs ?? []).map((p) => [p.id, p.display_name]));
  return userIds
    .map((id) => ({ user_id: id, display_name: nameMap.get(id) ?? "Fan", total: totals.get(id) ?? 0 }))
    .sort((a, b) => b.total - a.total);
}

export interface GlobalLeaderRow extends LeaderRow {
  primary_nation_code: string | null;
  primary_nation_name: string | null;
  nation_codes: string[]; // all stamped nations
  advanced_count: number; // filled in by page after computing WC standings
  bonus: number;
}

export async function getGlobalLeaderboard(limit = 100): Promise<GlobalLeaderRow[]> {
  const [{ data: pts }, { data: profs }, { data: stamps }] = await Promise.all([
    supabase.from("points").select("user_id, delta"),
    supabase.from("profiles").select("id, display_name, primary_nation_code, primary_nation_name"),
    supabase.from("stamps").select("user_id, nation_code"),
  ]);
  const totals = new Map<string, number>();
  for (const r of pts ?? []) totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + (r.delta ?? 0));
  const stampMap = new Map<string, string[]>();
  for (const s of stamps ?? []) {
    if (!stampMap.has(s.user_id)) stampMap.set(s.user_id, []);
    stampMap.get(s.user_id)!.push(s.nation_code);
  }
  const rows: GlobalLeaderRow[] = (profs ?? []).map((p) => ({
    user_id: p.id,
    display_name: p.display_name ?? "Fan",
    total: totals.get(p.id) ?? 0,
    primary_nation_code: p.primary_nation_code,
    primary_nation_name: p.primary_nation_name,
    nation_codes: stampMap.get(p.id) ?? [],
    advanced_count: 0,
    bonus: 0,
  }));
  return rows.sort((a, b) => b.total - a.total).slice(0, limit);
}
