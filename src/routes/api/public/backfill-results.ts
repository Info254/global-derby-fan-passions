import { createFileRoute } from "@tanstack/react-router";
import {
  computeOutcomeInserts,
  RESULTS_SOURCE,
  RESULTS_UPDATED_AT,
  RESULTS_VERSION,
  VERIFIED_MATCH_IDS,
  type PointInsert,
} from "@/lib/verified-results";

// Scheduled backfill: re-imports the verified knockout results (semifinals,
// third-place, final) and recomputes outcome points for every user, in case a
// live update was missed. Idempotent — existing point rows are never duplicated.
// Call with header: x-backfill-key: <BACKFILL_SECRET>
async function runBackfill(): Promise<Response> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: stamps, error: stampErr } = await supabaseAdmin
    .from("stamps")
    .select("user_id, role, nation_code");
  if (stampErr) throw stampErr;

  const { data: existing, error: pointErr } = await supabaseAdmin
    .from("points")
    .select("user_id, reason")
    .eq("source", "outcome")
    .in("match_id", VERIFIED_MATCH_IDS);
  if (pointErr) throw pointErr;

  const byUser = new Map<string, Array<{ role: string; nation_code: string }>>();
  for (const s of stamps ?? []) {
    const list = byUser.get(s.user_id) ?? [];
    list.push({ role: s.role, nation_code: s.nation_code });
    byUser.set(s.user_id, list);
  }

  const reasonsByUser = new Map<string, Set<string | null>>();
  for (const p of existing ?? []) {
    const set = reasonsByUser.get(p.user_id) ?? new Set<string | null>();
    set.add(p.reason);
    reasonsByUser.set(p.user_id, set);
  }

  const inserts: PointInsert[] = [];
  for (const [userId, userStamps] of byUser) {
    inserts.push(
      ...computeOutcomeInserts(userId, userStamps, reasonsByUser.get(userId) ?? new Set()),
    );
  }

  if (inserts.length) {
    const { error } = await supabaseAdmin.from("points").insert(inserts);
    if (error) throw error;
  }

  return Response.json({
    ok: true,
    ranAt: new Date().toISOString(),
    resultsVersion: RESULTS_VERSION,
    resultsUpdatedAt: RESULTS_UPDATED_AT,
    resultsSource: RESULTS_SOURCE,
    matches: VERIFIED_MATCH_IDS.length,
    usersScanned: byUser.size,
    pointsInserted: inserts.length,
  });
}

function authorize(request: Request): Response | null {
  const secret = process.env["BACKFILL_SECRET"];
  if (!secret) return new Response("Backfill not configured", { status: 503 });
  if (request.headers.get("x-backfill-key") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}

export const Route = createFileRoute("/api/public/backfill-results")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = authorize(request);
        if (denied) return denied;
        try {
          return await runBackfill();
        } catch (error) {
          console.error("backfill-results failed", error);
          return Response.json({ ok: false, error: "Backfill failed" }, { status: 500 });
        }
      },
      GET: async ({ request }) => {
        const denied = authorize(request);
        if (denied) return denied;
        return Response.json({
          ok: true,
          resultsVersion: RESULTS_VERSION,
          resultsUpdatedAt: RESULTS_UPDATED_AT,
          resultsSource: RESULTS_SOURCE,
          matches: VERIFIED_MATCH_IDS,
        });
      },
    },
  },
});
