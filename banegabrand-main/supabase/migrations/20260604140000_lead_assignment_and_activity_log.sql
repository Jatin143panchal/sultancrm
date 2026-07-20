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
