-- Add new roles to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tl';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employee';