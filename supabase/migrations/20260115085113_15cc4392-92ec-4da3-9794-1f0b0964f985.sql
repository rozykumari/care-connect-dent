-- Fix: Patients Cannot Modify Their Own Appointments
-- Add UPDATE and DELETE policies for patients to manage future appointments

-- Allow patients to update their own future appointments
CREATE POLICY "Patients can update their own appointments"
ON public.appointments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id 
    AND p.user_id = auth.uid()
    AND date >= CURRENT_DATE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id 
    AND p.user_id = auth.uid()
  )
);

-- Allow patients to cancel (delete) their own future appointments
CREATE POLICY "Patients can cancel their own appointments"
ON public.appointments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id 
    AND p.user_id = auth.uid()
    AND date >= CURRENT_DATE
  )
);