-- Auto-generated: run this in Supabase SQL Editor (Dashboard → SQL → New query)

-- ========== 20260403093618_678eda0b-2a81-4126-b22d-cd7696b8f9ba.sql ==========

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lead status enum
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'lost');

-- Leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT,
  status lead_status NOT NULL DEFAULT 'new',
  value NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  tags TEXT[] DEFAULT '{}',
  last_contact TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own contacts" ON public.contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own contacts" ON public.contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON public.contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON public.contacts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Deal stage enum
CREATE TYPE public.deal_stage AS ENUM ('prospecting', 'proposal', 'negotiation', 'closed_won', 'closed_lost');

-- Deals table
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT,
  value NUMERIC DEFAULT 0,
  stage deal_stage NOT NULL DEFAULT 'prospecting',
  probability INTEGER DEFAULT 20,
  contact_name TEXT,
  expected_close DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own deals" ON public.deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own deals" ON public.deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deals" ON public.deals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deals" ON public.deals FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Activity type enum
CREATE TYPE public.activity_type AS ENUM ('call', 'email', 'meeting', 'task', 'note');

-- Activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type activity_type NOT NULL DEFAULT 'task',
  title TEXT NOT NULL,
  description TEXT,
  contact_name TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON public.activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON public.activities FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ========== 20260406052014_8c06a3cc-b039-414f-9aec-706e69dc03ea.sql ==========

-- Create admin role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Holidays table
CREATE TABLE public.holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  type text NOT NULL DEFAULT 'public',
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view holidays" ON public.holidays
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage holidays" ON public.holidays
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add assigned_to column to leads and activities for task assignment
ALTER TABLE public.leads ADD COLUMN assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.activities ADD COLUMN assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add progress percentage to deals
ALTER TABLE public.deals ADD COLUMN progress integer DEFAULT 0;

-- Business status tracking on leads
ALTER TABLE public.leads ADD COLUMN business_status text DEFAULT 'active';

-- Allow admins to view all data
CREATE POLICY "Admins can view all leads" ON public.leads
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all deals" ON public.deals
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all activities" ON public.activities
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all contacts" ON public.contacts
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for holidays updated_at
CREATE TRIGGER update_holidays_updated_at
  BEFORE UPDATE ON public.holidays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();


-- ========== 20260407080921_fb7908f3-1275-484d-9d4d-e94f8534d276.sql ==========

-- Complaints / Helpdesk tickets table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT DEFAULT 'general',
  assigned_to UUID,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own complaints" ON public.complaints FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own complaints" ON public.complaints FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all complaints" ON public.complaints FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all complaints" ON public.complaints FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'present',
  type TEXT NOT NULL DEFAULT 'regular',
  notes TEXT,
  location_in TEXT,
  location_out TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance" ON public.attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON public.attendance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all attendance" ON public.attendance FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all attendance" ON public.attendance FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Campaigns / Marketing table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'email',
  status TEXT NOT NULL DEFAULT 'draft',
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns" ON public.campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON public.campaigns FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all campaigns" ON public.campaigns FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ========== 20260408050701_0806d4cd-543e-47de-ad3b-5568423d9a42.sql ==========

-- Lead Sources
CREATE TABLE public.lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own lead_sources" ON public.lead_sources FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all lead_sources" ON public.lead_sources FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own categories" ON public.categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all categories" ON public.categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Expense Heads
CREATE TABLE public.expense_heads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expense_heads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own expense_heads" ON public.expense_heads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all expense_heads" ON public.expense_heads FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Templates
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'email',
  subject text,
  body text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own templates" ON public.templates FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all templates" ON public.templates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Terms & Conditions
CREATE TABLE public.terms_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.terms_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own terms_conditions" ON public.terms_conditions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all terms_conditions" ON public.terms_conditions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Custom Fields
CREATE TABLE public.custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL DEFAULT 'leads',
  field_name text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  field_options jsonb,
  is_required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own custom_fields" ON public.custom_fields FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all custom_fields" ON public.custom_fields FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Services
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price numeric DEFAULT 0,
  unit text DEFAULT 'per unit',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own services" ON public.services FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all services" ON public.services FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Modules config
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own modules" ON public.modules FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all modules" ON public.modules FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Email Settings
CREATE TABLE public.email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  smtp_user text,
  smtp_password text,
  from_name text,
  from_email text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own email_settings" ON public.email_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Dashboard Columns config
CREATE TABLE public.dashboard_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  column_name text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  module text NOT NULL DEFAULT 'dashboard',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dashboard_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own dashboard_columns" ON public.dashboard_columns FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ========== 20260504060459_50dc6790-ad3a-4fb8-8a67-d4c3fbeec839.sql ==========
-- Add new roles to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tl';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employee';

-- ========== 20260504062230_811aee66-2dd9-46f3-8376-c494ec0dbe23.sql ==========

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all notifications" ON public.notifications FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Daily reports
CREATE TABLE public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed TEXT,
  tasks_pending TEXT,
  hours_worked NUMERIC DEFAULT 0,
  blockers TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own daily reports" ON public.daily_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leaders view all daily reports" ON public.daily_reports FOR SELECT USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'hr_manager') OR has_role(auth.uid(),'tl')
);
CREATE TRIGGER trg_daily_reports_updated BEFORE UPDATE ON public.daily_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Weekly reports
CREATE TABLE public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  summary TEXT,
  achievements TEXT,
  challenges TEXT,
  next_week_plan TEXT,
  total_hours NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own weekly reports" ON public.weekly_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leaders view all weekly reports" ON public.weekly_reports FOR SELECT USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'hr_manager') OR has_role(auth.uid(),'tl')
);
CREATE TRIGGER trg_weekly_reports_updated BEFORE UPDATE ON public.weekly_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars',true) ON CONFLICT DO NOTHING;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Replace handle_new_user_role to assign role based on email
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role app_role;
BEGIN
  assigned_role := CASE lower(NEW.email)
    WHEN 'owner@gmail.com' THEN 'owner'::app_role
    WHEN 'admin@gmail.com' THEN 'admin'::app_role
    WHEN 'hr@gmail.com' THEN 'hr_manager'::app_role
    WHEN 'tl@gmail.com' THEN 'tl'::app_role
    WHEN 'manager@gmail.com' THEN 'tl'::app_role
    ELSE 'employee'::app_role
  END;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Make sure triggers exist for auto profile + role on signup
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();


-- ========== 20260505131747_ddfcc634-fb3f-4976-9e6a-4dd59172978b.sql ==========

-- Update role auto-assignment trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  assigned_role app_role;
BEGIN
  assigned_role := CASE lower(NEW.email)
    WHEN 'owner@gmail.com' THEN 'owner'::app_role
    WHEN 'admin@gmail.com' THEN 'admin'::app_role
    WHEN 'hr@gmail.com' THEN 'hr_manager'::app_role
    WHEN 'tl@gmail.com' THEN 'tl'::app_role
    WHEN 'manager@gmail.com' THEN 'tl'::app_role
    WHEN 'rohit@banegabrand.com' THEN 'owner'::app_role
    WHEN 'rohit@ojavingroup.com' THEN 'owner'::app_role
    WHEN 'owner@banegabrand.com' THEN 'owner'::app_role
    WHEN 'admin@banegabrand.com' THEN 'admin'::app_role
    WHEN 'hr@banegabrand.com' THEN 'hr_manager'::app_role
    WHEN 'tl@banegabrand.com' THEN 'tl'::app_role
    WHEN 'manager@banegabrand.com' THEN 'tl'::app_role
    ELSE 'employee'::app_role
  END;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Add task progress columns to activities
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS task_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS employee_remarks text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Allow assignees to view & update their assigned activities
DROP POLICY IF EXISTS "Assignees can view assigned activities" ON public.activities;
CREATE POLICY "Assignees can view assigned activities"
ON public.activities FOR SELECT
USING (auth.uid() = assigned_to);

DROP POLICY IF EXISTS "Assignees can update assigned activities" ON public.activities;
CREATE POLICY "Assignees can update assigned activities"
ON public.activities FOR UPDATE
USING (auth.uid() = assigned_to);

DROP POLICY IF EXISTS "Leaders can view all activities" ON public.activities;
CREATE POLICY "Leaders can view all activities"
ON public.activities FOR SELECT
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'hr_manager'::app_role)
  OR has_role(auth.uid(), 'tl'::app_role)
);

DROP POLICY IF EXISTS "Leaders can insert activities" ON public.activities;
CREATE POLICY "Leaders can insert activities"
ON public.activities FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'hr_manager'::app_role)
  OR has_role(auth.uid(), 'tl'::app_role)
);

-- DigiLocker verifications
CREATE TABLE IF NOT EXISTS public.digilocker_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_type text NOT NULL DEFAULT 'aadhaar',
  document_number text,
  document_url text,
  full_name text,
  date_of_birth date,
  verification_status text NOT NULL DEFAULT 'pending',
  verified_by uuid,
  verified_at timestamptz,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.digilocker_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own digilocker"
ON public.digilocker_verifications FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leaders view all digilocker"
ON public.digilocker_verifications FOR SELECT
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'hr_manager'::app_role)
);

CREATE POLICY "Leaders update digilocker"
ON public.digilocker_verifications FOR UPDATE
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'hr_manager'::app_role)
);

CREATE TRIGGER trg_digilocker_updated_at
BEFORE UPDATE ON public.digilocker_verifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for digilocker documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('digilocker', 'digilocker', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own digilocker docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'digilocker' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own digilocker docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'digilocker' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own digilocker docs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'digilocker' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Leaders read all digilocker docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'digilocker' AND (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'hr_manager'::app_role)
  )
);


-- ========== 20260507101547_e814773f-9e1e-4aaa-ac58-693ff31d5cfe.sql ==========

-- Allow owners and admins to broadcast notifications to any user
DROP POLICY IF EXISTS "Users insert own notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'hr_manager'::app_role)
);

DROP POLICY IF EXISTS "Owners manage all notifications" ON public.notifications;
CREATE POLICY "Owners manage all notifications"
ON public.notifications FOR ALL
USING (has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Update role trigger to assign Rohit as owner with new email pattern (already there) and ensure idempotent
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  assigned_role app_role;
BEGIN
  assigned_role := CASE lower(NEW.email)
    WHEN 'rohit@banegabrand.com' THEN 'owner'::app_role
    WHEN 'rohit@ojavingroup.com' THEN 'owner'::app_role
    WHEN 'owner@banegabrand.com' THEN 'owner'::app_role
    WHEN 'admin@banegabrand.com' THEN 'admin'::app_role
    WHEN 'hr@banegabrand.com' THEN 'hr_manager'::app_role
    WHEN 'tl@banegabrand.com' THEN 'tl'::app_role
    WHEN 'manager@banegabrand.com' THEN 'tl'::app_role
    ELSE 'employee'::app_role
  END;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;


-- ========== 20260507101755_b2f7bf90-eca8-4fae-8038-a39f89de44e6.sql ==========

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;


-- ========== 20260507111037_03a8c060-e22d-4c53-a707-37ae4ab7e10f.sql ==========

CREATE POLICY "Owners can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "HR can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'hr_manager'::app_role));

CREATE POLICY "Owners can update any profile"
ON public.profiles FOR UPDATE
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can view all roles"
ON public.user_roles FOR SELECT
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "HR can view all roles"
ON public.user_roles FOR SELECT
USING (has_role(auth.uid(), 'hr_manager'::app_role));


-- ========== 20260508065155_2ea7e32e-98d1-4a52-8052-9ba8b0c9dc1f.sql ==========
-- Add HR Manager policy to view all attendance records
CREATE POLICY "HR Managers can view all attendance"
ON public.attendance
FOR SELECT
TO public
USING (has_role(auth.uid(), 'hr_manager'::app_role));

-- ========== 20260604091519_49c50c06-21d1-4473-84ff-e6dab19d3c22.sql ==========

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_type text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS cx_comment text,
  ADD COLUMN IF NOT EXISTS budget text,
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS sub_stage text,
  ADD COLUMN IF NOT EXISTS remark text;


-- ========== 20260604120000_lead_status_extended.sql ==========
-- Extend lead_status for call outcomes and conversion
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'answered';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'not_answered';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'converted';


-- ========== 20260604130000_banegabrand_gmail_roles.sql ==========
-- BanegaBrand: Gmail-based role assignment for new Supabase project
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  assigned_role app_role;
BEGIN
  assigned_role := CASE lower(NEW.email)
    -- Primary Gmail logins
    WHEN 'banegabrand.owner@gmail.com' THEN 'owner'::app_role
    WHEN 'banegabrand.admin@gmail.com' THEN 'admin'::app_role
    WHEN 'banegabrand.hr@gmail.com' THEN 'hr_manager'::app_role
    WHEN 'banegabrand.tl@gmail.com' THEN 'tl'::app_role
    WHEN 'banegabrand.manager@gmail.com' THEN 'tl'::app_role
    -- Legacy / alternate emails (keep for existing rows)
    WHEN 'owner@gmail.com' THEN 'owner'::app_role
    WHEN 'admin@gmail.com' THEN 'admin'::app_role
    WHEN 'hr@gmail.com' THEN 'hr_manager'::app_role
    WHEN 'tl@gmail.com' THEN 'tl'::app_role
    WHEN 'manager@gmail.com' THEN 'tl'::app_role
    WHEN 'rohit@banegabrand.com' THEN 'owner'::app_role
    WHEN 'owner@banegabrand.com' THEN 'owner'::app_role
    WHEN 'admin@banegabrand.com' THEN 'admin'::app_role
    WHEN 'hr@banegabrand.com' THEN 'hr_manager'::app_role
    WHEN 'tl@banegabrand.com' THEN 'tl'::app_role
    WHEN 'manager@banegabrand.com' THEN 'tl'::app_role
    ELSE 'employee'::app_role
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;


-- ========== 20260604140000_lead_assignment_and_activity_log.sql ==========
-- Lead assignment RLS: assignees + leaders can view/update leads
-- Activity log for employee CRM actions visible to managers

-- Assignees can view leads assigned to them
DROP POLICY IF EXISTS "Assignees can view assigned leads" ON public.leads;
CREATE POLICY "Assignees can view assigned leads"
ON public.leads FOR SELECT
USING (auth.uid() = assigned_to);

-- Assignees can update leads assigned to them
DROP POLICY IF EXISTS "Assignees can update assigned leads" ON public.leads;
CREATE POLICY "Assignees can update assigned leads"
ON public.leads FOR UPDATE
USING (auth.uid() = assigned_to);

-- Leaders can view all leads
DROP POLICY IF EXISTS "Leaders can view all leads" ON public.leads;
CREATE POLICY "Leaders can view all leads"
ON public.leads FOR SELECT
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'hr_manager'::app_role)
  OR has_role(auth.uid(), 'tl'::app_role)
);

-- Leaders can update all leads (assign, change status)
DROP POLICY IF EXISTS "Leaders can update all leads" ON public.leads;
CREATE POLICY "Leaders can update all leads"
ON public.leads FOR UPDATE
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'hr_manager'::app_role)
  OR has_role(auth.uid(), 'tl'::app_role)
);

-- Admin can update all leads (admin had SELECT-only before)
DROP POLICY IF EXISTS "Admins can update all leads" ON public.leads;
CREATE POLICY "Admins can update all leads"
ON public.leads FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- TL can view all profiles (for assignment dropdown)
DROP POLICY IF EXISTS "TL can view all profiles" ON public.profiles;
CREATE POLICY "TL can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'tl'::app_role));

-- Admin can view all activities (was missing from leaders policy)
DROP POLICY IF EXISTS "Leaders can view all activities" ON public.activities;
CREATE POLICY "Leaders can view all activities"
ON public.activities FOR SELECT
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'hr_manager'::app_role)
  OR has_role(auth.uid(), 'tl'::app_role)
);

-- Lead activity log: track employee CRM actions
CREATE TABLE IF NOT EXISTS public.lead_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activity_log_lead_id ON public.lead_activity_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activity_log_user_id ON public.lead_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_activity_log_created_at ON public.lead_activity_log(created_at DESC);

ALTER TABLE public.lead_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own lead activity" ON public.lead_activity_log;
CREATE POLICY "Users can insert own lead activity"
ON public.lead_activity_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own lead activity" ON public.lead_activity_log;
CREATE POLICY "Users can view own lead activity"
ON public.lead_activity_log FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Leaders can view all lead activity" ON public.lead_activity_log;
CREATE POLICY "Leaders can view all lead activity"
ON public.lead_activity_log FOR SELECT
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'hr_manager'::app_role)
  OR has_role(auth.uid(), 'tl'::app_role)
);


-- ========== 20260604150000_admin_user_management.sql ==========
-- Admin user management: extended profile fields + admin/owner can update all users

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS employee_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Sync email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Backfill email for existing users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND (p.email IS NULL OR p.email = '');

-- Owner + Admin can update any profile
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Owner can manage all roles (admin already has policy)
DROP POLICY IF EXISTS "Owners can manage roles" ON public.user_roles;
CREATE POLICY "Owners can manage roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Replace single role per user helper: set primary role
CREATE OR REPLACE FUNCTION public.set_user_primary_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_primary_role(uuid, app_role) TO authenticated;


-- ========== 20260604160000_lead_comments_and_followup.sql ==========
-- Lead comments with timestamps + follow-up scheduling

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_call_date date;

CREATE TABLE IF NOT EXISTS public.lead_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  call_outcome text,
  next_call_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_comments_lead_id ON public.lead_comments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_comments_created_at ON public.lead_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_next_call_date ON public.leads(next_call_date);

ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view lead comments on accessible leads" ON public.lead_comments;
CREATE POLICY "Users can view lead comments on accessible leads"
ON public.lead_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_id
    AND (
      l.user_id = auth.uid()
      OR l.assigned_to = auth.uid()
      OR has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'hr_manager'::app_role)
      OR has_role(auth.uid(), 'tl'::app_role)
    )
  )
);

DROP POLICY IF EXISTS "Users can insert lead comments on accessible leads" ON public.lead_comments;
CREATE POLICY "Users can insert lead comments on accessible leads"
ON public.lead_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_id
    AND (
      l.user_id = auth.uid()
      OR l.assigned_to = auth.uid()
      OR has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'hr_manager'::app_role)
      OR has_role(auth.uid(), 'tl'::app_role)
    )
  )
);

