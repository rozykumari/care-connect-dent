-- Add NOT NULL constraint to phone (should already be set, but ensure it)
ALTER TABLE public.patients ALTER COLUMN phone SET NOT NULL;

-- Add unique constraint to phone
ALTER TABLE public.patients ADD CONSTRAINT patients_phone_unique UNIQUE (phone);

-- Create family_members table for relatives
CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text NOT NULL,
  date_of_birth date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on family_members
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Patients can view their own family members
CREATE POLICY "Patients can view their own family members"
ON public.family_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = family_members.patient_id 
    AND p.user_id = auth.uid()
  )
);

-- Patients can insert their own family members
CREATE POLICY "Patients can insert their own family members"
ON public.family_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = family_members.patient_id 
    AND p.user_id = auth.uid()
  )
);

-- Patients can update their own family members
CREATE POLICY "Patients can update their own family members"
ON public.family_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = family_members.patient_id 
    AND p.user_id = auth.uid()
  )
);

-- Patients can delete their own family members
CREATE POLICY "Patients can delete their own family members"
ON public.family_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = family_members.patient_id 
    AND p.user_id = auth.uid()
  )
);

-- Doctors can view all family members
CREATE POLICY "Doctors can view all family members"
ON public.family_members
FOR SELECT
USING (has_role(auth.uid(), 'doctor'));

-- Doctors can manage all family members
CREATE POLICY "Doctors can manage all family members"
ON public.family_members
FOR ALL
USING (has_role(auth.uid(), 'doctor'));

-- Add trigger for updated_at
CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add family_member_id to appointments table (nullable, for booking family member appointments)
ALTER TABLE public.appointments ADD COLUMN family_member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL;