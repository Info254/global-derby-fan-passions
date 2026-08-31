import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeOutcomeInserts, VERIFIED_MATCH_IDS } from "@/lib/verified-results";

export const syncOutcomePoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: stamps } = await supabase
      .from("stamps")
      .select("role, nation_code")
      .eq("user_id", userId);

    if (!stamps?.length) return { inserted: 0, delta: 0 };

    const { data: existing } = await supabase
      .from("points")
      .select("reason")
      .eq("user_id", userId)
      .eq("source", "outcome")
      .in("match_id", VERIFIED_MATCH_IDS);

    const existingReasons = new Set((existing ?? []).map((p) => p.reason));
    const inserts = computeOutcomeInserts(userId, stamps, existingReasons);

    if (!inserts.length) return { inserted: 0, delta: 0 };

    const { error } = await supabase.from("points").insert(inserts);
    if (error) throw error;

    return {
      inserted: inserts.length,
      delta: inserts.reduce((sum, row) => sum + row.delta, 0),
    };
  });
