
REVOKE EXECUTE ON FUNCTION public.award_reaction_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_solidarity_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_stamp_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
