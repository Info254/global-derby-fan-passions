DROP TRIGGER IF EXISTS trg_log_stamp_change ON public.stamps;
ALTER TABLE public.stamps DROP CONSTRAINT IF EXISTS stamps_user_id_role_key;
ALTER TABLE public.stamps ADD CONSTRAINT stamps_user_role_competition_key UNIQUE (user_id, role, competition);