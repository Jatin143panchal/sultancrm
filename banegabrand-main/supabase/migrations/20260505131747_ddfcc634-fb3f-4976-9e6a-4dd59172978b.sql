
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
