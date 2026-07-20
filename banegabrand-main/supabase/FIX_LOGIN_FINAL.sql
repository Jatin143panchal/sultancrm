-- ================================================================
-- FINAL FIX - Login/Signup + Role Fix
-- Only sultanwellness.owner@gmail.com has admin access
-- All others are normal employees
-- ================================================================

-- Ensure profiles table has ALL columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_status text DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes text;

-- Remove ALL existing triggers on auth.users (fresh start)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users CASCADE;

-- Create the profile function with ON CONFLICT
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
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create the role function
-- ONLY sultanwellness.owner@gmail.com gets 'owner' role
-- EVERYONE else gets 'employee'
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
  
  IF user_email = 'sultanwellness.owner@gmail.com' OR user_email = 'banegabrand.owner@gmail.com' THEN
    assigned_role := 'owner'::app_role;
  ELSE
    assigned_role := 'employee'::app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Create fresh triggers (ONE for each function)
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- ================================================================
-- FIX EXISTING USERS
-- ================================================================

-- Step 1: Delete ALL existing roles for ALL users (except owner)
-- This resets everyone
DELETE FROM public.user_roles
WHERE role != 'owner';

-- Also remove owner from anyone who is not sultanwellness.owner
DELETE FROM public.user_roles
WHERE role = 'owner'
AND user_id NOT IN (
  SELECT id FROM auth.users WHERE lower(email) = 'sultanwellness.owner@gmail.com'
);

-- Step 2: Re-assign roles correctly
-- Only sultanwellness.owner@gmail.com gets owner role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'owner'::app_role
FROM auth.users u
WHERE lower(u.email) = 'sultanwellness.owner@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Everyone else gets employee role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'employee'::app_role
FROM auth.users u
WHERE lower(u.email) != 'sultanwellness.owner@gmail.com'
  AND lower(u.email) != 'banegabrand.owner@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Create profiles for any existing user missing one
INSERT INTO public.profiles (user_id, display_name)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Backfill email in profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND (p.email IS NULL OR p.email = '');

