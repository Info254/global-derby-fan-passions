
-- ENUMS
CREATE TYPE public.stamp_role AS ENUM ('primary','second_home','underdog','family_pick','wildcard','bandwagon');
CREATE TYPE public.reaction_kind AS ENUM ('goal','miss','var','red_card','elimination','penalty','assist','sub','roast','hype');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ===== TABLES (all created first, policies later) =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Fan',
  avatar_url TEXT,
  primary_nation_code TEXT,
  primary_nation_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.circle_members (
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (circle_id, user_id)
);

CREATE TABLE public.stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.stamp_role NOT NULL,
  nation_code TEXT NOT NULL,
  nation_name TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.loyalty_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  role public.stamp_role,
  nation_code TEXT,
  nation_name TEXT,
  previous_nation_code TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  match_label TEXT,
  minute INT,
  kind public.reaction_kind NOT NULL,
  emoji TEXT,
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reactions_circle_match_idx ON public.reactions (circle_id, match_id, created_at DESC);

-- ===== GRANTS =====
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.circles TO authenticated;
GRANT ALL ON public.circles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.circle_members TO authenticated;
GRANT ALL ON public.circle_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stamps TO authenticated;
GRANT ALL ON public.stamps TO service_role;
GRANT SELECT, INSERT ON public.loyalty_history TO authenticated;
GRANT ALL ON public.loyalty_history TO service_role;
GRANT SELECT, INSERT, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;

-- ===== RLS ENABLE =====
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- ===== SECURITY DEFINER HELPERS =====
CREATE OR REPLACE FUNCTION public.is_circle_member(_circle UUID, _user UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.circle_members WHERE circle_id = _circle AND user_id = _user);
$$;

CREATE OR REPLACE FUNCTION public.shares_circle_with(_other UUID, _me UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members a
    JOIN public.circle_members b ON a.circle_id = b.circle_id
    WHERE a.user_id = _me AND b.user_id = _other
  );
$$;

-- ===== POLICIES =====
CREATE POLICY "profiles_select_self_or_circle" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.shares_circle_with(id, auth.uid()));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "circles_select_members" ON public.circles FOR SELECT TO authenticated
  USING (public.is_circle_member(id, auth.uid()));
CREATE POLICY "circles_insert_self" ON public.circles FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "circles_update_creator" ON public.circles FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "circles_delete_creator" ON public.circles FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "members_select_in_circle" ON public.circle_members FOR SELECT TO authenticated
  USING (public.is_circle_member(circle_id, auth.uid()));
CREATE POLICY "members_insert_self" ON public.circle_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "members_delete_self" ON public.circle_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "stamps_select_self_or_circle" ON public.stamps FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.shares_circle_with(user_id, auth.uid()));
CREATE POLICY "stamps_write_self" ON public.stamps FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "loyalty_select_self_or_circle" ON public.loyalty_history FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.shares_circle_with(user_id, auth.uid()));
CREATE POLICY "loyalty_insert_self" ON public.loyalty_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "reactions_select_in_circle" ON public.reactions FOR SELECT TO authenticated
  USING (public.is_circle_member(circle_id, auth.uid()));
CREATE POLICY "reactions_insert_in_circle" ON public.reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_circle_member(circle_id, auth.uid()));
CREATE POLICY "reactions_delete_own" ON public.reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ===== TRIGGERS =====
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1), 'Fan'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Stamp -> loyalty_history mirror
CREATE OR REPLACE FUNCTION public.log_stamp_change() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.loyalty_history(user_id, event, role, nation_code, nation_name, note)
    VALUES (NEW.user_id, 'stamp_added', NEW.role, NEW.nation_code, NEW.nation_name, NEW.note);
  ELSIF TG_OP = 'UPDATE' AND (OLD.nation_code IS DISTINCT FROM NEW.nation_code) THEN
    INSERT INTO public.loyalty_history(user_id, event, role, nation_code, nation_name, previous_nation_code, note)
    VALUES (NEW.user_id, CASE WHEN NEW.role='primary' THEN 'primary_changed' ELSE 'stamp_changed' END,
            NEW.role, NEW.nation_code, NEW.nation_name, OLD.nation_code, NEW.note);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.loyalty_history(user_id, event, role, nation_code, nation_name)
    VALUES (OLD.user_id, 'stamp_removed', OLD.role, OLD.nation_code, OLD.nation_name);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER stamps_log AFTER INSERT OR UPDATE OR DELETE ON public.stamps
FOR EACH ROW EXECUTE FUNCTION public.log_stamp_change();

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_members;
