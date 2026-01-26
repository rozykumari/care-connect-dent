-- Fix: Restrict patients table policies to authenticated users only
-- Problem: policies target 'public' role which includes unauthenticated anon users

-- Drop existing policies
DROP POLICY IF EXISTS "Doctors can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can update patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can delete patients" ON public.patients;
DROP POLICY IF EXISTS "Patients can view their own record" ON public.patients;
DROP POLICY IF EXISTS "Patients can update their own record" ON public.patients;

-- Recreate policies with authenticated role
CREATE POLICY "Doctors can view all patients"
ON public.patients
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can insert patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can update patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can delete patients"
ON public.patients
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Patients can view their own record"
ON public.patients
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Patients can update their own record"
ON public.patients
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);