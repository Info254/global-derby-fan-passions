
CREATE OR REPLACE FUNCTION public.get_global_leaderboard(_limit int DEFAULT 100)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  primary_nation_code text,
  primary_nation_name text,
  total bigint,
  nation_codes text[]
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    COALESCE(p.display_name, 'Fan'),
    p.primary_nation_code,
    p.primary_nation_name,
    COALESCE((SELECT SUM(delta)::bigint FROM public.points WHERE user_id = p.id), 0),
    COALESCE((SELECT array_agg(DISTINCT nation_code) FROM public.stamps WHERE user_id = p.id), '{}')
  FROM public.profiles p
  ORDER BY 5 DESC NULLS LAST
  LIMIT GREATEST(_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_global_leaderboard(int) TO authenticated, anon;
