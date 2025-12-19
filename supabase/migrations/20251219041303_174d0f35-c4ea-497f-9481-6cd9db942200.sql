-- Add boolean time columns to patient_prescriptions
ALTER TABLE public.patient_prescriptions 
ADD COLUMN IF NOT EXISTS time_morning boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS time_noon boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS time_evening boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS time_sos boolean NOT NULL DEFAULT false;

-- Drop the old time column
ALTER TABLE public.patient_prescriptions DROP COLUMN IF EXISTS time;

-- Create RLS policies for doctors to manage all prescriptions
CREATE POLICY "Doctors can view all prescriptions" 
ON public.patient_prescriptions 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can insert prescriptions for patients" 
ON public.patient_prescriptions 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can update all prescriptions" 
ON public.patient_prescriptions 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can delete all prescriptions" 
ON public.patient_prescriptions 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'doctor'));

-- Create RLS policies for doctors to manage all procedures
CREATE POLICY "Doctors can view all procedures" 
ON public.patient_procedures 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can insert procedures for patients" 
ON public.patient_procedures 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can update all procedures" 
ON public.patient_procedures 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can delete all procedures" 
ON public.patient_procedures 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'doctor'));

-- Create RLS policies for doctors to view all allergies
CREATE POLICY "Doctors can view all allergies" 
ON public.patient_allergies 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'doctor'));

-- Allow doctors to view all profiles for patient selection
CREATE POLICY "Doctors can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'doctor'));