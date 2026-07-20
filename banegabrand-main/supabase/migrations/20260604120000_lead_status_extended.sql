-- Extend lead_status for call outcomes and conversion
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'answered';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'not_answered';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'converted';
