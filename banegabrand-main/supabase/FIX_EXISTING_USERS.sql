-- ================================================================
-- FIX: Assign roles + profiles to EXISTING users who missed them
-- Run AFTER RUN_THIS_FIX_v3.sql
-- ================================================================

-- 1. Ensure all auth users have a profile
INSERT INTO public.profiles (user_id, display_name)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 2. Ensure all auth users have a role assigned
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  CASE 
    
    WHEN lower(u.email) = 'sultanwellness.owner@gmail.com' THEN 'owner'::app_role
    WHEN lower(u.email) = 'sultanwellness.admin@gmail.com' THEN 'admin'::app_role
    WHEN lower(u.email) = 'sultanwellness.hr@gmail.com' THEN 'hr_manager'::app_role
    WHEN lower(u.email) = 'sultanwellness.tl@gmail.com' THEN 'tl'::app_role
    WHEN lower(u.email) LIKE 'banegabrand.%@gmail.com' THEN 'employee'::app_role
    WHEN lower(u.email) LIKE 'sultanwellness.%@gmail.com' THEN 'employee'::app_role
    ELSE 'employee'::app_role
  END
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. For sultanwellness.admin@gmail.com specifically - assign admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE lower(email) = 'sultanwellness.admin@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

