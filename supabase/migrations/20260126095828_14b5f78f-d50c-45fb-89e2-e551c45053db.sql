-- Fix #1: Create unified create_appointment RPC for doctors that validates slots
-- This ensures doctors can only create appointments within their availability windows

CREATE OR REPLACE FUNCTION public.create_appointment(
  p_patient_id uuid,
  p_doctor_id uuid,
  p_date date,
  p_time time,
  p_type text DEFAULT 'consultation',
  p_duration integer DEFAULT 30,
  p_notes text DEFAULT NULL,
  p_family_member_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointment_id uuid;
  v_day_of_week integer;
BEGIN
  -- Verify caller is a doctor OR owns the patient record
  IF NOT (has_role(auth.uid(), 'doctor') OR 
    EXISTS (SELECT 1 FROM patients WHERE id = p_patient_id AND user_id = auth.uid())) 
  THEN
    RAISE EXCEPTION 'Unauthorized: You do not have permission to create this appointment';
  END IF;

  -- Check slot is within doctor availability
  v_day_of_week := EXTRACT(DOW FROM p_date)::integer;
  IF NOT EXISTS (
    SELECT 1 FROM doctor_availability
    WHERE doctor_id = p_doctor_id
    AND day_of_week = v_day_of_week
    AND is_active = true
    AND p_time >= start_time
    AND p_time + (p_duration || ' minutes')::interval <= end_time
  ) THEN
    RAISE EXCEPTION 'Time slot not available in doctor schedule';
  END IF;

  -- Check for conflicts (existing non-cancelled appointments at same time)
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE doctor_id = p_doctor_id
    AND date = p_date
    AND time = p_time
    AND status != 'cancelled'
  ) THEN
    RAISE EXCEPTION 'This time slot is already booked';
  END IF;

  -- Verify family member belongs to this patient (if specified)
  IF p_family_member_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM family_members 
      WHERE id = p_family_member_id 
      AND patient_id = p_patient_id
    ) THEN
      RAISE EXCEPTION 'Invalid family member';
    END IF;
  END IF;

  -- Insert the appointment
  INSERT INTO appointments (
    patient_id, doctor_id, date, time, type, duration, status, notes, family_member_id
  ) VALUES (
    p_patient_id, p_doctor_id, p_date, p_time, p_type, p_duration, 'scheduled', p_notes, p_family_member_id
  ) RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;

-- Fix #2: Update RLS policies for patient_procedures to check both user_id and patient_id
-- This prevents inconsistent access when both fields are set

-- Drop existing patient policies
DROP POLICY IF EXISTS "Users can view their own procedures" ON patient_procedures;
DROP POLICY IF EXISTS "Users can insert their own procedures" ON patient_procedures;
DROP POLICY IF EXISTS "Users can update their own procedures" ON patient_procedures;
DROP POLICY IF EXISTS "Users can delete their own procedures" ON patient_procedures;

-- Create new policies that check both user_id and patient_id
CREATE POLICY "Users can view their own procedures"
ON patient_procedures FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM patients WHERE id = patient_id AND user_id = auth.uid())
);

CREATE POLICY "Users can insert their own procedures"
ON patient_procedures FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM patients WHERE id = patient_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update their own procedures"
ON patient_procedures FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM patients WHERE id = patient_id AND user_id = auth.uid())
);

CREATE POLICY "Users can delete their own procedures"
ON patient_procedures FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM patients WHERE id = patient_id AND user_id = auth.uid())
);

-- Fix #3: Update RLS policies for patient_prescriptions to check both user_id and patient_id
-- Drop existing patient policies
DROP POLICY IF EXISTS "Users can view their own prescriptions" ON patient_prescriptions;
DROP POLICY IF EXISTS "Users can insert their own prescriptions" ON patient_prescriptions;
DROP POLICY IF EXISTS "Users can update their own prescriptions" ON patient_prescriptions;
DROP POLICY IF EXISTS "Users can delete their own prescriptions" ON patient_prescriptions;

-- Create new policies that check both user_id and patient_id
CREATE POLICY "Users can view their own prescriptions"
ON patient_prescriptions FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM patients WHERE id = patient_id AND user_id = auth.uid())
);

CREATE POLICY "Users can insert their own prescriptions"
ON patient_prescriptions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM patients WHERE id = patient_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update their own prescriptions"
ON patient_prescriptions FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM patients WHERE id = patient_id AND user_id = auth.uid())
);

CREATE POLICY "Users can delete their own prescriptions"
ON patient_prescriptions FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM patients WHERE id = patient_id AND user_id = auth.uid())
);

-- Fix #4: Update doctor INSERT policies to enforce user_id/patient_id consistency
DROP POLICY IF EXISTS "Doctors can insert procedures for patients" ON patient_procedures;
CREATE POLICY "Doctors can insert procedures for patients"
ON patient_procedures FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'doctor') AND
  (user_id IS NULL OR patient_id IS NULL OR 
   user_id = (SELECT p.user_id FROM patients p WHERE p.id = patient_id))
);

DROP POLICY IF EXISTS "Doctors can insert prescriptions for patients" ON patient_prescriptions;
CREATE POLICY "Doctors can insert prescriptions for patients"
ON patient_prescriptions FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'doctor') AND
  (user_id IS NULL OR patient_id IS NULL OR 
   user_id = (SELECT p.user_id FROM patients p WHERE p.id = patient_id))
);