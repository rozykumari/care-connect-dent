-- Allow patients to update their own patient record
CREATE POLICY "Patients can update their own record"
ON public.patients
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);