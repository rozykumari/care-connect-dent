-- Fix: Doctor Identity Exposed via Public Availability Table
-- Problem: doctor_id UUIDs are exposed to all authenticated users
-- Solution: Create secure functions that don't expose doctor_id

-- Create a function to get available slots without exposing doctor_id
CREATE OR REPLACE FUNCTION public.get_doctor_availability()
RETURNS TABLE (
  id uuid,
  day_of_week integer,
  start_time time,
  end_time time,
  slot_duration integer
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    da.id,
    da.day_of_week,
    da.start_time,
    da.end_time,
    da.slot_duration
  FROM doctor_availability da
  WHERE da.is_active = true;
$$;

-- Create a function to book an appointment without client knowing doctor_id
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_patient_id uuid,
  p_date date,
  p_time time,
  p_type text DEFAULT 'consultation',
  p_notes text DEFAULT NULL,
  p_duration integer DEFAULT 30,
  p_family_member_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_id uuid;
  v_appointment_id uuid;
  v_patient_user_id uuid;
BEGIN
  -- Verify the patient belongs to the authenticated user
  SELECT user_id INTO v_patient_user_id
  FROM patients
  WHERE id = p_patient_id;
  
  IF v_patient_user_id IS NULL OR v_patient_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot book for this patient';
  END IF;

  -- Get the first active doctor (single-doctor clinic)
  SELECT doctor_id INTO v_doctor_id
  FROM doctor_availability
  WHERE is_active = true
  LIMIT 1;
  
  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'No doctor available';
  END IF;

  -- Verify the family member belongs to this patient (if specified)
  IF p_family_member_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM family_members 
      WHERE id = p_family_member_id 
      AND patient_id = p_patient_id
    ) THEN
      RAISE EXCEPTION 'Invalid family member';
    END IF;
  END IF;

  -- Check if slot is already booked
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE date = p_date 
    AND time = p_time 
    AND status != 'cancelled'
  ) THEN
    RAISE EXCEPTION 'This time slot is already booked';
  END IF;

  -- Insert the appointment
  INSERT INTO appointments (
    patient_id,
    doctor_id,
    date,
    time,
    type,
    status,
    notes,
    duration,
    family_member_id
  ) VALUES (
    p_patient_id,
    v_doctor_id,
    p_date,
    p_time,
    p_type,
    'scheduled',
    p_notes,
    p_duration,
    p_family_member_id
  )
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view doctor availability" ON public.doctor_availability;

-- Doctors can still view their own availability directly
-- This policy already exists: "Doctors can manage their own availability"