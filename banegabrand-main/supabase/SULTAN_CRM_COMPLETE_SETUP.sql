-- ═══════════════════════════════════════════════════════════════════
-- SULTAN CRM — COMPLETE DATABASE SETUP MIGRATION
-- Run this in Supabase Dashboard → SQL Editor (https://supabase.com/dashboard/project/gzvkbrkracajwizmnzgx/sql/new)
-- ═══════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. ROLES ENUM & TYPES ─────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'hr_manager', 'tl', 'employee', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'lost', 'answered', 'not_answered', 'converted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ── 2. HELPER FUNCTIONS ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 3. PROFILES TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ── 4. USER ROLES TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ── 5. ROLE CHECK FUNCTIONS (SECURITY DEFINER) ────────────────────
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
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
    WHERE user_id = _user_id AND (role = 'admin'::public.app_role OR role = 'owner'::public.app_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND (role = 'admin'::public.app_role OR role = 'owner'::public.app_role OR role = 'tl'::public.app_role)
  );
$$;

-- ── 6. LEADS TABLE ────────────────────────────────────────────────
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

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 7. LEAD ACTIVITY LOG ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activity_log ENABLE ROW LEVEL SECURITY;

-- ── 8. LEAD COMMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;

-- ── 9. ATTENDANCE TABLE ───────────────────────────────────────────
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

-- ── 10. NOTIFICATIONS TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ── 11. ACTIVITIES TABLE ──────────────────────────────────────────
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

-- ── 12. DEALS TABLE ───────────────────────────────────────────────
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

-- ── 13. CONTACTS TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- ── 14. COMPLAINTS & REPORTS TABLES ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT DEFAULT 'general',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed TEXT,
  challenges TEXT,
  plan_tomorrow TEXT,
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  summary TEXT,
  achievements TEXT,
  next_week_goals TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- ── 15. COMPATIBILITY VIEWS ───────────────────────────────────────
-- Agents view: Provides instant compatibility with code expecting `agents`
CREATE OR REPLACE VIEW public.agents AS
SELECT 
  p.user_id AS id,
  COALESCE(p.display_name, split_part(p.email, '@', 1), 'Agent') AS name,
  COALESCE(p.email, '') AS email,
  COALESCE(p.phone, '') AS phone,
  COALESCE(p.department, 'Telecalling') AS department,
  COALESCE(ur.role::text, 'employee') AS role,
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

-- Lead Activity view with INSTEAD OF INSERT trigger
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

-- ── 16. AUTH TRIGGERS ─────────────────────────────────────────────
-- On new signup: create profile with full name and email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, phone, department, employee_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'department', 'Telecalling'),
    'active'
  )
  ON CONFLICT (user_id) DO UPDATE SET
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

-- On new signup: assign role
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
  v_count INTEGER;
  v_meta_role TEXT;
BEGIN
  SELECT count(*) INTO v_count FROM public.user_roles;
  v_meta_role := lower(COALESCE(NEW.raw_user_meta_data->>'role', ''));

  -- First registered user is automatically Owner/Admin!
  IF v_count = 0 THEN
    v_role := 'admin'::public.app_role;
  -- If metadata role was provided when Admin created the user:
  ELSIF v_meta_role IN ('admin', 'owner', 'tl', 'hr_manager', 'employee') THEN
    v_role := v_meta_role::public.app_role;
  -- Check for standard admin email patterns
  ELSIF lower(NEW.email) LIKE '%admin%' OR lower(NEW.email) LIKE '%owner%' THEN
    v_role := 'admin'::public.app_role;
  ELSE
    v_role := 'employee'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Also give 'owner' role to the very first user
  IF v_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'owner'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- RPC: set_user_primary_role (Admin can change any user's role)
CREATE OR REPLACE FUNCTION public.set_user_primary_role(_user_id UUID, _role public.app_role)
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

GRANT EXECUTE ON FUNCTION public.set_user_primary_role(UUID, public.app_role) TO authenticated;

-- ── 17. ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────────

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;
CREATE POLICY "Anyone authenticated can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

-- USER ROLES POLICIES
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- LEADS POLICIES:
-- 1. SELECT: Admins/Owners see all leads; Employees see ONLY their assigned leads
DROP POLICY IF EXISTS "Leads select policy" ON public.leads;
CREATE POLICY "Leads select policy"
ON public.leads FOR SELECT
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid()) 
  OR public.has_role(auth.uid(), 'tl'::public.app_role)
  OR assigned_to = auth.uid()
);

-- 2. INSERT: Only Admin / Owner can insert leads! Employees cannot add leads!
DROP POLICY IF EXISTS "Leads insert policy" ON public.leads;
CREATE POLICY "Leads insert policy"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
  OR public.has_role(auth.uid(), 'tl'::public.app_role)
);

-- 3. UPDATE: Admins can update any lead; Employees can update their assigned leads (to update call status, stage, notes)
DROP POLICY IF EXISTS "Leads update policy" ON public.leads;
CREATE POLICY "Leads update policy"
ON public.leads FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
  OR public.has_role(auth.uid(), 'tl'::public.app_role)
  OR assigned_to = auth.uid()
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
  OR public.has_role(auth.uid(), 'tl'::public.app_role)
  OR assigned_to = auth.uid()
);

-- 4. DELETE: Only Admin / Owner can delete leads!
DROP POLICY IF EXISTS "Leads delete policy" ON public.leads;
CREATE POLICY "Leads delete policy"
ON public.leads FOR DELETE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- LEAD ACTIVITY LOG POLICIES
DROP POLICY IF EXISTS "Activity log select policy" ON public.lead_activity_log;
CREATE POLICY "Activity log select policy"
ON public.lead_activity_log FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Activity log insert policy" ON public.lead_activity_log;
CREATE POLICY "Activity log insert policy"
ON public.lead_activity_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

-- LEAD COMMENTS POLICIES
DROP POLICY IF EXISTS "Lead comments select policy" ON public.lead_comments;
CREATE POLICY "Lead comments select policy"
ON public.lead_comments FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Lead comments insert policy" ON public.lead_comments;
CREATE POLICY "Lead comments insert policy"
ON public.lead_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

-- ATTENDANCE POLICIES
DROP POLICY IF EXISTS "Attendance select policy" ON public.attendance;
CREATE POLICY "Attendance select policy"
ON public.attendance FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()) OR public.has_role(auth.uid(), 'hr_manager'::public.app_role));

DROP POLICY IF EXISTS "Attendance insert/update policy" ON public.attendance;
CREATE POLICY "Attendance insert/update policy"
ON public.attendance FOR ALL
TO authenticated
USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Notifications policy" ON public.notifications;
CREATE POLICY "Notifications policy"
ON public.notifications FOR ALL
TO authenticated
USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

-- ACTIVITIES / TASKS POLICIES
DROP POLICY IF EXISTS "Activities select policy" ON public.activities;
CREATE POLICY "Activities select policy"
ON public.activities FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR assigned_to = auth.uid() OR public.is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Activities manage policy" ON public.activities;
CREATE POLICY "Activities manage policy"
ON public.activities FOR ALL
TO authenticated
USING (auth.uid() = user_id OR assigned_to = auth.uid() OR public.is_admin_or_owner(auth.uid()))
WITH CHECK (auth.uid() = user_id OR assigned_to = auth.uid() OR public.is_admin_or_owner(auth.uid()));

-- DEALS & CONTACTS POLICIES
DROP POLICY IF EXISTS "Deals policy" ON public.deals;
CREATE POLICY "Deals policy" ON public.deals FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Contacts policy" ON public.contacts;
CREATE POLICY "Contacts policy" ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
