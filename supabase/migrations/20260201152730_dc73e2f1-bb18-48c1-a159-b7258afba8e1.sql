-- Add explicit deny policies for anonymous users on sensitive tables
-- This provides defense-in-depth protection for sensitive patient data

-- Deny anonymous access to patients table
CREATE POLICY "Deny anonymous access to patients" 
ON public.patients 
FOR SELECT 
TO anon 
USING (false);

-- Deny anonymous access to patient_allergies table
CREATE POLICY "Deny anonymous access to patient_allergies" 
ON public.patient_allergies 
FOR SELECT 
TO anon 
USING (false);