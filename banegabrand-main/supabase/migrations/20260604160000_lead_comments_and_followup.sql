-- Lead comments with timestamps + follow-up scheduling
-- Employees can log call notes; owner/admin/manager can view full history

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_call_date date;

CREATE TABLE IF NOT EXISTS public.lead_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  call_outcome text,
  next_call_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_comments_lead_id ON public.lead_comments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_comments_created_at ON public.lead_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_next_call_date ON public.leads(next_call_date);

ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on leads they own, are assigned to, or if they are leaders
DROP POLICY IF EXISTS "Users can view lead comments on accessible leads" ON public.lead_comments;
CREATE POLICY "Users can view lead comments on accessible leads"
ON public.lead_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_id
    AND (
      l.user_id = auth.uid()
      OR l.assigned_to = auth.uid()
      OR has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'hr_manager'::app_role)
      OR has_role(auth.uid(), 'tl'::app_role)
    )
  )
);

-- Users can insert comments on leads they own or are assigned to, or if leader
DROP POLICY IF EXISTS "Users can insert lead comments on accessible leads" ON public.lead_comments;
CREATE POLICY "Users can insert lead comments on accessible leads"
ON public.lead_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_id
    AND (
      l.user_id = auth.uid()
      OR l.assigned_to = auth.uid()
      OR has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'hr_manager'::app_role)
      OR has_role(auth.uid(), 'tl'::app_role)
    )
  )
);
