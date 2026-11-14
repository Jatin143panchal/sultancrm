-- ═══════════════════════════════════════════════════════════════════
-- SULTAN CRM — 100% BULLETPROOF SETUP MIGRATION
-- Works seamlessly in Supabase SQL Editor (No enum transaction locks)
-- Run in: https://supabase.com/dashboard/project/gzvkbrkracajwizmnzgx/sql/new
-- ═══════════════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. HELPER FUNCTION ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 2. PROFILES TABLE (CREATE OR EXTEND) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  department TEXT DEFAULT 'Telecalling',
  job_title TEXT DEFAULT 'Telecaller',
  employee_status TEXT NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all required columns exist on profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Telecalling',
  ADD COLUMN IF NOT EXISTS job_title TEXT DEFAULT 'Telecaller',
  ADD COLUMN IF NOT EXISTS employee_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Sync user_id = id if user_id was null
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
UPDATE public.profiles SET display_name = full_name WHERE display_name IS NULL AND full_name IS NOT NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ── 3. USER ROLES TABLE (TEXT ROLE, NO ENUM DEADLOCK) ─────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ── 4. ROLE CHECK FUNCTIONS ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND (role = 'admin' OR role = 'owner')
  );
$$;

-- ── 5. LEADS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_code TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  medicine TEXT,
  disease TEXT,
  qty_days NUMERIC,
  value NUMERIC DEFAULT 0,
  lead_type TEXT DEFAULT 'Herbal & Ayurvedic',
  source TEXT DEFAULT 'Website',
  source_details TEXT,
  budget TEXT DEFAULT 'Below Rs 50k',
  stage TEXT DEFAULT 'New',
  sub_stage TEXT DEFAULT '-',
  temperature TEXT DEFAULT 'Warm',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_status TEXT DEFAULT 'New Order',
  previous_history TEXT,
  remark TEXT,
  lost_reason TEXT,
  lost_date TIMESTAMPTZ,
  business_status TEXT DEFAULT 'active',
  next_call_date TIMESTAMPTZ,
  call_status TEXT DEFAULT 'pending',
  last_call_at TIMESTAMPTZ,
  lead_score NUMERIC DEFAULT 0,
  conversion_probability NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 6. LEAD ACTIVITY LOG ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activity_log ENABLE ROW LEVEL SECURITY;

-- ── 7. LEAD COMMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;

-- ── 8. ATTENDANCE TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'present',
  type TEXT NOT NULL DEFAULT 'full_day',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ── 9. NOTIFICATIONS (EXTEND EXISTING) ───────────────────────────
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- ── 10. ACTIVITIES & DEALS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'call',
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  task_status TEXT DEFAULT 'pending',
  employee_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT,
  value NUMERIC DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'prospecting',
  probability NUMERIC DEFAULT 10,
  contact_name TEXT,
  expected_close DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- ── 11. COMPATIBILITY VIEWS ───────────────────────────────────────
CREATE OR REPLACE VIEW public.agents AS
SELECT 
  p.user_id AS id,
  COALESCE(p.display_name, p.full_name, split_part(p.email, '@', 1), 'Agent') AS name,
  COALESCE(p.email, '') AS email,
  COALESCE(p.phone, '') AS phone,
  COALESCE(p.department, 'Telecalling') AS department,
  COALESCE(ur.role, 'employee') AS role,
  'online'::text AS status,
  p.created_at,
  'AGT-' || UPPER(SUBSTRING(p.user_id::text, 1, 4)) AS agent_code,
  NULL::text AS login_time,
  NULL::text AS break_time,
  NULL::text AS logout_time,
  0::numeric AS total_working_hours,
  0::numeric AS total_breaks,
  50::integer AS target_calls,
  5::integer AS target_conversions
FROM public.profiles p
LEFT JOIN (
  SELECT DISTINCT ON (user_id) user_id, role 
  FROM public.user_roles 
  ORDER BY user_id, 
    CASE role 
      WHEN 'owner' THEN 1 
      WHEN 'admin' THEN 2 
      WHEN 'tl' THEN 3 
      WHEN 'hr_manager' THEN 4 
      ELSE 5 
    END
) ur ON ur.user_id = p.user_id;

CREATE OR REPLACE VIEW public.lead_activity AS
SELECT 
  id,
  lead_id,
  user_id,
  action,
  details AS detail,
  created_at
FROM public.lead_activity_log;

CREATE OR REPLACE FUNCTION public.handle_insert_lead_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.lead_activity_log (lead_id, user_id, action, details)
  VALUES (NEW.lead_id, COALESCE(NEW.user_id, auth.uid()), NEW.action, COALESCE(NEW.detail, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_lead_activity_insert ON public.lead_activity;
CREATE TRIGGER trg_lead_activity_insert
INSTEAD OF INSERT ON public.lead_activity
FOR EACH ROW EXECUTE FUNCTION public.handle_insert_lead_activity();

-- ── 12. AUTO-SYNC EXISTING USERS & MAKE ADMIN ─────────────────────
INSERT INTO public.profiles (id, user_id, display_name, full_name, email, department, job_title, employee_status)
SELECT 
  u.id, 
  u.id, 
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  u.email,
  'Management',
  'Administrator',
  'active'
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
  email = EXCLUDED.email;

-- Assign Admin & Owner roles to admin/jatin users
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
WHERE lower(u.email) LIKE '%admin%' 
   OR lower(u.email) LIKE '%jatin%'
   OR lower(u.email) LIKE '%owner%'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'owner'
FROM auth.users u
WHERE lower(u.email) LIKE '%admin%' 
   OR lower(u.email) LIKE '%jatin%'
   OR lower(u.email) LIKE '%owner%'
ON CONFLICT (user_id, role) DO NOTHING;

-- ── 13. AUTH TRIGGERS FOR FUTURE SIGNUPS ──────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, display_name, full_name, email, phone, department, employee_status)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'department', 'Telecalling'),
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_meta_role TEXT;
BEGIN
  v_meta_role := lower(COALESCE(NEW.raw_user_meta_data->>'role', ''));

  IF v_meta_role IN ('admin', 'owner', 'tl', 'hr_manager', 'employee') THEN
    v_role := v_meta_role;
  ELSIF lower(NEW.email) LIKE '%admin%' OR lower(NEW.email) LIKE '%jatin%' THEN
    v_role := 'admin';
  ELSE
    v_role := 'employee';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE OR REPLACE FUNCTION public.set_user_primary_role(_user_id UUID, _role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized. Only Admin or Owner can change user roles.';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_primary_role(UUID, TEXT) TO authenticated;

-- ── 14. ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────────

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;
CREATE POLICY "Anyone authenticated can view profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR auth.uid() = id OR public.is_admin_or_owner(auth.uid()))
WITH CHECK (auth.uid() = user_id OR auth.uid() = id OR public.is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR auth.uid() = id OR public.is_admin_or_owner(auth.uid()));

-- USER ROLES POLICIES
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- LEADS POLICIES:
-- 1. SELECT: Admin sees all; Employee sees ONLY their assigned leads
DROP POLICY IF EXISTS "Leads select policy" ON public.leads;
CREATE POLICY "Leads select policy"
ON public.leads FOR SELECT TO authenticated
USING (
  public.is_admin_or_owner(auth.uid()) 
  OR public.has_role(auth.uid(), 'tl')
  OR assigned_to = auth.uid()
);

-- 2. INSERT: Only Admin / Owner / TL can insert leads! Employees cannot add leads!
DROP POLICY IF EXISTS "Leads insert policy" ON public.leads;
CREATE POLICY "Leads insert policy"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
  OR public.has_role(auth.uid(), 'tl')
);

-- 3. UPDATE: Admins can update any; Employees can update ONLY their assigned leads
DROP POLICY IF EXISTS "Leads update policy" ON public.leads;
CREATE POLICY "Leads update policy"
ON public.leads FOR UPDATE TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
  OR public.has_role(auth.uid(), 'tl')
  OR assigned_to = auth.uid()
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
  OR public.has_role(auth.uid(), 'tl')
  OR assigned_to = auth.uid()
);

-- 4. DELETE: Only Admin / Owner can delete leads!
DROP POLICY IF EXISTS "Leads delete policy" ON public.leads;
CREATE POLICY "Leads delete policy"
ON public.leads FOR DELETE TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- LEAD ACTIVITY LOG POLICIES
DROP POLICY IF EXISTS "Activity log select policy" ON public.lead_activity_log;
CREATE POLICY "Activity log select policy"
ON public.lead_activity_log FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Activity log insert policy" ON public.lead_activity_log;
CREATE POLICY "Activity log insert policy"
ON public.lead_activity_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

-- LEAD COMMENTS POLICIES
DROP POLICY IF EXISTS "Lead comments select policy" ON public.lead_comments;
CREATE POLICY "Lead comments select policy"
ON public.lead_comments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Lead comments insert policy" ON public.lead_comments;
CREATE POLICY "Lead comments insert policy"
ON public.lead_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

-- ATTENDANCE POLICIES
DROP POLICY IF EXISTS "Attendance select policy" ON public.attendance;
CREATE POLICY "Attendance select policy"
ON public.attendance FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()) OR public.has_role(auth.uid(), 'hr_manager'));

DROP POLICY IF EXISTS "Attendance insert/update policy" ON public.attendance;
CREATE POLICY "Attendance insert/update policy"
ON public.attendance FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

-- DEALS & ACTIVITIES POLICIES
DROP POLICY IF EXISTS "Deals policy" ON public.deals;
CREATE POLICY "Deals policy" ON public.deals FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Activities policy" ON public.activities;
CREATE POLICY "Activities policy" ON public.activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
