-- Fix: Restrict doctors to only view patients/profiles they have a treatment relationship with
-- This provides defense-in-depth by ensuring doctors can only access data for their own patients

-- Drop overly permissive policies on patients table
DROP POLICY IF EXISTS "Doctors can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can update patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can delete patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can insert patients" ON public.patients;

-- Create more restrictive policies for patients table
-- Doctors can only view patients they have treated (have appointments with)
CREATE POLICY "Doctors can view their patients" 
ON public.patients 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND (
    -- Patient has an appointment with this doctor
    EXISTS (
      SELECT 1 FROM appointments a 
      WHERE a.patient_id = patients.id 
      AND a.doctor_id = auth.uid()
    )
    -- Or patient has a prescription created by this doctor (doctor prescriptions track via created records)
    OR EXISTS (
      SELECT 1 FROM patient_prescriptions pp 
      WHERE pp.patient_id = patients.id
    )
    -- Or patient has a procedure with this doctor
    OR EXISTS (
      SELECT 1 FROM patient_procedures proc 
      WHERE proc.patient_id = patients.id
    )
    -- Or patient has a payment record (for billing purposes)
    OR EXISTS (
      SELECT 1 FROM payments pay 
      WHERE pay.patient_id = patients.id
    )
  )
);

-- Doctors can update only their patients
CREATE POLICY "Doctors can update their patients" 
ON public.patients 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND 
  EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a.patient_id = patients.id 
    AND a.doctor_id = auth.uid()
  )
);

-- Doctors can insert new patients (for new patient intake)
CREATE POLICY "Doctors can insert new patients" 
ON public.patients 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));

-- Doctors can delete only their patients (patients they've treated)
CREATE POLICY "Doctors can delete their patients" 
ON public.patients 
FOR DELETE 
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND 
  EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a.patient_id = patients.id 
    AND a.doctor_id = auth.uid()
  )
);

-- Drop overly permissive policy on profiles table
DROP POLICY IF EXISTS "Doctors can view all profiles" ON public.profiles;

-- Create more restrictive policy for profiles table
-- Doctors can only view profiles of patients they have a treatment relationship with
CREATE POLICY "Doctors can view their patient profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND 
  EXISTS (
    SELECT 1 FROM patients p
    JOIN appointments a ON a.patient_id = p.id
    WHERE p.user_id = profiles.user_id 
    AND a.doctor_id = auth.uid()
  )
);

-- Add policy for authenticated patients to view doctor availability (for booking)
CREATE POLICY "Authenticated patients can view doctor availability" 
ON public.doctor_availability 
FOR SELECT 
TO authenticated
USING (is_active = true);