
-- POINTS
CREATE TABLE public.points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  circle_id uuid REFERENCES public.circles(id) ON DELETE CASCADE,
  match_id text,
  source text NOT NULL,
  delta int NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.points TO authenticated;
GRANT ALL ON public.points TO service_role;
ALTER TABLE public.points ENABLE ROW LEVEL SECURITY;
CREATE POLICY points_select_self_or_circle ON public.points FOR SELECT
  USING (user_id = auth.uid() OR (circle_id IS NOT NULL AND public.is_circle_member(circle_id, auth.uid())));
CREATE POLICY points_insert_self ON public.points FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE INDEX points_user_idx ON public.points(user_id);
CREATE INDEX points_circle_idx ON public.points(circle_id);

-- REACTION TEMPLATES
CREATE TABLE public.reaction_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.reaction_kind NOT NULL,
  label text NOT NULL,
  emoji text,
  text text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reaction_templates TO authenticated;
GRANT ALL ON public.reaction_templates TO service_role;
ALTER TABLE public.reaction_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY rt_all_self ON public.reaction_templates FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- SOLIDARITY ("stand with" another nation, like Africans for Mexico)
CREATE TABLE public.solidarity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  circle_id uuid REFERENCES public.circles(id) ON DELETE CASCADE,
  match_id text,
  with_nation_code text NOT NULL,
  with_nation_name text NOT NULL,
  against_nation_code text,
  against_nation_name text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.solidarity TO authenticated;
GRANT ALL ON public.solidarity TO service_role;
ALTER TABLE public.solidarity ENABLE ROW LEVEL SECURITY;
CREATE POLICY sol_select_self_or_circle ON public.solidarity FOR SELECT
  USING (user_id = auth.uid() OR (circle_id IS NOT NULL AND public.is_circle_member(circle_id, auth.uid())));
CREATE POLICY sol_insert_self ON public.solidarity FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY sol_delete_self ON public.solidarity FOR DELETE
  USING (user_id = auth.uid());

-- TRIGGER: award points on reaction insert
CREATE OR REPLACE FUNCTION public.award_reaction_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.points(user_id, circle_id, match_id, source, delta, reason)
  VALUES (NEW.user_id, NEW.circle_id, NEW.match_id, 'reaction', 5, NEW.kind::text);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_award_reaction_points
AFTER INSERT ON public.reactions
FOR EACH ROW EXECUTE FUNCTION public.award_reaction_points();

-- TRIGGER: award points on solidarity insert
CREATE OR REPLACE FUNCTION public.award_solidarity_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.points(user_id, circle_id, match_id, source, delta, reason)
  VALUES (NEW.user_id, NEW.circle_id, NEW.match_id, 'solidarity', 10, 'stand_with_' || NEW.with_nation_code);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_award_solidarity_points
AFTER INSERT ON public.solidarity
FOR EACH ROW EXECUTE FUNCTION public.award_solidarity_points();

-- REPLACE stamp change logger to also award/deduct points and mark abandonment
CREATE OR REPLACE FUNCTION public.log_stamp_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.loyalty_history(user_id, event, role, nation_code, nation_name, note)
    VALUES (NEW.user_id, 'stamp_added', NEW.role, NEW.nation_code, NEW.nation_name, NEW.note);
    INSERT INTO public.points(user_id, source, delta, reason)
    VALUES (NEW.user_id, 'stamp', 20, 'added_' || NEW.role::text);
  ELSIF TG_OP = 'UPDATE' AND (OLD.nation_code IS DISTINCT FROM NEW.nation_code) THEN
    INSERT INTO public.loyalty_history(user_id, event, role, nation_code, nation_name, previous_nation_code, note)
    VALUES (NEW.user_id, CASE WHEN NEW.role='primary' THEN 'primary_changed' ELSE 'stamp_changed' END,
            NEW.role, NEW.nation_code, NEW.nation_name, OLD.nation_code, NEW.note);
    INSERT INTO public.points(user_id, source, delta, reason)
    VALUES (NEW.user_id, 'stamp', -10, 'switched_from_' || OLD.nation_code);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.loyalty_history(user_id, event, role, nation_code, nation_name, note)
    VALUES (OLD.user_id, 'stamp_abandoned', OLD.role, OLD.nation_code, OLD.nation_name,
            'Stand with your team to the end.');
    INSERT INTO public.points(user_id, source, delta, reason)
    VALUES (OLD.user_id, 'stamp', -15, 'abandoned_' || OLD.nation_code);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_log_stamp_change ON public.stamps;
CREATE TRIGGER trg_log_stamp_change
AFTER INSERT OR UPDATE OR DELETE ON public.stamps
FOR EACH ROW EXECUTE FUNCTION public.log_stamp_change();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.points;
ALTER PUBLICATION supabase_realtime ADD TABLE public.solidarity;
