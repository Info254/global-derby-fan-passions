ALTER TABLE public.stamps ADD COLUMN IF NOT EXISTS competition text NOT NULL DEFAULT 'WC2026';
ALTER TABLE public.points ADD COLUMN IF NOT EXISTS competition text NOT NULL DEFAULT 'WC2026';
ALTER TABLE public.loyalty_history ADD COLUMN IF NOT EXISTS competition text NOT NULL DEFAULT 'WC2026';

CREATE INDEX IF NOT EXISTS stamps_user_competition_idx ON public.stamps(user_id, competition);
CREATE INDEX IF NOT EXISTS points_user_competition_idx ON public.points(user_id, competition);

CREATE OR REPLACE FUNCTION public.log_stamp_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.loyalty_history(user_id, event, role, nation_code, nation_name, note, competition)
    VALUES (NEW.user_id, 'stamp_added', NEW.role, NEW.nation_code, NEW.nation_name, NEW.note, NEW.competition);
    INSERT INTO public.points(user_id, source, delta, reason, competition)
    VALUES (NEW.user_id, 'stamp', 20, 'added_' || NEW.role::text, NEW.competition);
  ELSIF TG_OP = 'UPDATE' AND (OLD.nation_code IS DISTINCT FROM NEW.nation_code) THEN
    INSERT INTO public.loyalty_history(user_id, event, role, nation_code, nation_name, previous_nation_code, note, competition)
    VALUES (NEW.user_id, CASE WHEN NEW.role='primary' THEN 'primary_changed' ELSE 'stamp_changed' END,
            NEW.role, NEW.nation_code, NEW.nation_name, OLD.nation_code, NEW.note, NEW.competition);
    INSERT INTO public.points(user_id, source, delta, reason, competition)
    VALUES (NEW.user_id, 'stamp', -10, 'switched_from_' || OLD.nation_code, NEW.competition);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.loyalty_history(user_id, event, role, nation_code, nation_name, note, competition)
    VALUES (OLD.user_id, 'stamp_abandoned', OLD.role, OLD.nation_code, OLD.nation_name,
            'Stand with your team to the end.', OLD.competition);
    INSERT INTO public.points(user_id, source, delta, reason, competition)
    VALUES (OLD.user_id, 'stamp', -15, 'abandoned_' || OLD.nation_code, OLD.competition);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $function$;