-- ================================================================
-- COMPLETE FIX v2 - Login/Signup Database Error
-- Run this in Supabase SQL Editor
-- ================================================================

-- STEP 1: Ensure profiles table has all needed columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_status text NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes text;

-- STEP 2: Drop ALL existing triggers on auth.users to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- STEP 3: Replace handle_new_user() - with ON CONFLICT and ONLY display_name to be safe
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

-- STEP 4: Create the profile trigger
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 5: Replace handle_new_user_role() - includes ALL BanegaBrand emails
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
    WHEN 'banegabrand.owner@gmail.com' THEN 'owner'::app_role
    WHEN 'banegabrand.admin@gmail.com' THEN 'admin'::app_role
    WHEN 'banegabrand.hr@gmail.com' THEN 'hr_manager'::app_role
    WHEN 'banegabrand.tl@gmail.com' THEN 'tl'::app_role
    WHEN 'banegabrand.manager@gmail.com' THEN 'tl'::app_role
    ELSE 'employee'::app_role
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- STEP 6: Create the role trigger
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- STEP 7: Backfill email for existing profiles that have NULL email
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND (p.email IS NULL OR p.email = '');

