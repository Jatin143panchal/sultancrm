DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  assigned_role app_role;
BEGIN
  IF lower(NEW.email) = 'sultanwellness.owner@gmail.com' THEN
    assigned_role := 'owner'::app_role;
  ELSE
    assigned_role := 'employee'::app_role;
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

DELETE FROM public.user_roles WHERE role != 'owner' AND role != 'employee';
DELETE FROM public.user_roles
WHERE role = 'owner'
AND user_id NOT IN (SELECT id FROM auth.users WHERE lower(email) = 'sultanwellness.owner@gmail.com');
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::app_role FROM auth.users WHERE lower(email) = 'sultanwellness.owner@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'employee'::app_role FROM auth.users u WHERE lower(u.email) != 'sultanwellness.owner@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

