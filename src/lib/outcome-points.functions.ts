import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const syncOutcomePoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const verifiedOutcomes = [
      {
        matchId: "101",
        homeCode: "FRA",
        awayCode: "ESP",
        homeScore: 0,
        awayScore: 2,
      },
    ];

    const { data: stamps } = await supabase
      .from("stamps")
      .select("role, nation_code, nation_name")
      .eq("user_id", userId);

    if (!stamps?.length) return { inserted: 0, delta: 0 };

    const matchIds = verifiedOutcomes.map((m) => m.matchId);
    const { data: existing } = await supabase
      .from("points")
      .select("reason")
      .eq("user_id", userId)
      .eq("source", "outcome")
      .in("match_id", matchIds);

    const existingReasons = new Set((existing ?? []).map((p) => p.reason));
    const inserts: Array<{
      user_id: string;
      match_id: string;
      source: string;
      delta: number;
      reason: string;
    }> = [];

    for (const outcome of verifiedOutcomes) {
      const involved = stamps.filter(
        (s) => s.nation_code === outcome.homeCode || s.nation_code === outcome.awayCode,
      );
      if (!involved.length) continue;

      if (involved.length > 1) {
        const codes = involved.map((s) => s.nation_code).sort().join("_");
        const reason = `split_allegiance_${outcome.matchId}_${codes}`;
        if (!existingReasons.has(reason)) {
          inserts.push({
            user_id: userId,
            match_id: outcome.matchId,
            source: "outcome",
            delta: 5,
            reason,
          });
        }
        continue;
      }

      const stamp = involved[0];
      const isHome = stamp.nation_code === outcome.homeCode;
      const myScore = isHome ? outcome.homeScore : outcome.awayScore;
      const oppScore = isHome ? outcome.awayScore : outcome.homeScore;
      const result = myScore > oppScore ? "win" : myScore < oppScore ? "loss" : "draw";
      const primary = stamp.role === "primary";
      const delta = result === "win" ? (primary ? 30 : 15) : result === "draw" ? (primary ? 10 : 5) : (primary ? -10 : -5);
      const reason = `${result}_${stamp.role}_${stamp.nation_code}_${outcome.matchId}`;
      if (!existingReasons.has(reason)) {
        inserts.push({
          user_id: userId,
          match_id: outcome.matchId,
          source: "outcome",
          delta,
          reason,
        });
      }
    }

    if (!inserts.length) return { inserted: 0, delta: 0 };

    const { error } = await supabase.from("points").insert(inserts);
    if (error) throw error;

    return {
      inserted: inserts.length,
      delta: inserts.reduce((sum, row) => sum + row.delta, 0),
    };
  });