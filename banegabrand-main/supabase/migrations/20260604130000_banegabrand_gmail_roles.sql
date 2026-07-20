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
