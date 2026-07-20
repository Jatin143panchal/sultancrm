
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
