-- ================================================================
-- COMPLETE FIX v3 - Login/Signup + SultanWellness Email Support
-- Run this in Supabase SQL Editor: Dashboard -> SQL -> New query
-- ================================================================

-- STEP 1: Ensure app_role enum has all needed values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tl';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employee';

-- STEP 2: Ensure profiles table has all needed columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_status text DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes text;

-- STEP 3: Drop ALL existing triggers on auth.users to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- STEP 4: Replace handle_new_user() - simple and safe
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name;
  RETURN NEW;
END;
$$;

-- STEP 5: Create the profile trigger
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 6: Replace handle_new_user_role() - includes ALL BanegaBrand + SultanWellness emails
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  assigned_role app_role;
  user_email text;
BEGIN
  user_email := lower(NEW.email);
  
  assigned_role := CASE
    -- BanegaBrand emails

    -- SultanWellness emails
    WHEN user_email = 'sultanwellness.owner@gmail.com' THEN 'owner'::app_role
    WHEN user_email = 'sultanwellness.admin@gmail.com' THEN 'admin'::app_role
    WHEN user_email = 'sultanwellness.hr@gmail.com' THEN 'hr_manager'::app_role
    WHEN user_email = 'sultanwellness.tl@gmail.com' THEN 'tl'::app_role
    -- Legacy / alternate emails
    
    -- Pattern match for banegabrand.* and sultanwellness.* employees
    WHEN user_email LIKE 'banegabrand.%@gmail.com' THEN 'employee'::app_role
    WHEN user_email LIKE 'sultanwellness.%@gmail.com' THEN 'employee'::app_role
    ELSE 'employee'::app_role
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- STEP 7: Create the role trigger
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- STEP 8: Backfill email for existing profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND (p.email IS NULL OR p.email = '');

