-- ================================================================
-- FIX: Login/Signup not working - Duplicate triggers & missing ON CONFLICT
-- Run this in Supabase SQL Editor: Dashboard → SQL → New query
-- ================================================================

-- 1. DROP the OLD duplicate trigger (from first migration)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. FIX handle_new_user() - add ON CONFLICT to avoid duplicate key error
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
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- 3. FIX handle_new_user_role() - include ALL banegabrand.* emails + ON CONFLICT
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
    -- Primary BanegaBrand Gmail logins
    WHEN 'banegabrand.owner@gmail.com' THEN 'owner'::app_role
    WHEN 'banegabrand.admin@gmail.com' THEN 'admin'::app_role
    WHEN 'banegabrand.hr@gmail.com' THEN 'hr_manager'::app_role
    WHEN 'banegabrand.tl@gmail.com' THEN 'tl'::app_role
    WHEN 'banegabrand.manager@gmail.com' THEN 'tl'::app_role
    -- Legacy / alternate emails
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
    -- Any banegabrand.* email gets employee role
    WHEN lower(NEW.email) LIKE 'banegabrand.%@gmail.com' THEN 'employee'::app_role
    ELSE 'employee'::app_role
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 4. Ensure only ONE trigger exists for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Ensure role trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();
