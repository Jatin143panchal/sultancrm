-- Add HR Manager policy to view all attendance records
CREATE POLICY "HR Managers can view all attendance"
ON public.attendance
FOR SELECT
TO public
USING (has_role(auth.uid(), 'hr_manager'::app_role));