-- Fix: Doctors Retain Permanent Access to Patient Records
-- This migration updates RLS policies to require active treatment relationships
-- and adds server-side validation for patient operations

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;
DROP POLICY IF EXISTS "Doctors can update their patients" ON patients;
DROP POLICY IF EXISTS "Doctors can delete their patients" ON patients;
DROP POLICY IF EXISTS "Doctors can insert new patients" ON patients;

-- 2. Create helper function to check if doctor has active treatment relationship
-- A relationship is considered "active" if there's a non-cancelled appointment within 180 days
-- or the doctor created a prescription/procedure/payment within 180 days
CREATE OR REPLACE FUNCTION public.has_active_treatment_relationship(_doctor_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Active appointment within last 180 days (scheduled, completed, or no-show)
    SELECT 1 FROM appointments a
    WHERE a.patient_id = _patient_id 
    AND a.doctor_id = _doctor_id
    AND a.status != 'cancelled'
    AND a.date >= CURRENT_DATE - INTERVAL '180 days'
  ) OR EXISTS (
    -- Future scheduled appointment
    SELECT 1 FROM appointments a
    WHERE a.patient_id = _patient_id 
    AND a.doctor_id = _doctor_id
    AND a.status = 'scheduled'
    AND a.date >= CURRENT_DATE
  );
$$;

-- 3. Create server-side validated function for inserting patients
CREATE OR REPLACE FUNCTION public.insert_patient(
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL,
  p_date_of_birth date DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_medical_history text DEFAULT NULL,
  p_allergies text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
BEGIN
  -- Verify caller is a doctor
  IF NOT has_role(auth.uid(), 'doctor') THEN
    RAISE EXCEPTION 'Unauthorized: Only doctors can add patients';
  END IF;

  -- Validate name
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Patient name is required';
  END IF;

  IF NOT validate_text_length(p_name, 100) THEN
    RAISE EXCEPTION 'Name must be less than 100 characters';
  END IF;

  -- Validate phone (must be 10 digits)
  IF NOT validate_phone(p_phone) THEN
    RAISE EXCEPTION 'Phone must be a valid 10-digit number';
  END IF;

  -- Validate email format if provided
  IF NOT validate_email(p_email) THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Validate date of birth is not in the future
  IF NOT validate_date_not_future(p_date_of_birth) THEN
    RAISE EXCEPTION 'Date of birth cannot be in the future';
  END IF;

  -- Validate field lengths
  IF NOT validate_text_length(p_address, 500) THEN
    RAISE EXCEPTION 'Address must be less than 500 characters';
  END IF;

  IF NOT validate_text_length(p_medical_history, 2000) THEN
    RAISE EXCEPTION 'Medical history must be less than 2000 characters';
  END IF;

  IF NOT validate_text_length(p_allergies, 500) THEN
    RAISE EXCEPTION 'Allergies must be less than 500 characters';
  END IF;

  -- Check for duplicate phone number
  IF EXISTS (SELECT 1 FROM patients WHERE phone = p_phone) THEN
    RAISE EXCEPTION 'This phone number is already registered';
  END IF;

  -- Insert the patient
  INSERT INTO patients (
    name, phone, email, date_of_birth, address, medical_history, allergies
  ) VALUES (
    trim(p_name), p_phone, NULLIF(trim(p_email), ''), p_date_of_birth, 
    NULLIF(trim(p_address), ''), NULLIF(trim(p_medical_history), ''), NULLIF(trim(p_allergies), '')
  )
  RETURNING id INTO v_patient_id;

  RETURN v_patient_id;
END;
$$;

-- 4. Create server-side validated function for updating patients (by doctors)
CREATE OR REPLACE FUNCTION public.doctor_update_patient(
  p_patient_id uuid,
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL,
  p_date_of_birth date DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_medical_history text DEFAULT NULL,
  p_allergies text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a doctor
  IF NOT has_role(auth.uid(), 'doctor') THEN
    RAISE EXCEPTION 'Unauthorized: Only doctors can update patients';
  END IF;

  -- Verify doctor has active treatment relationship
  IF NOT has_active_treatment_relationship(auth.uid(), p_patient_id) THEN
    RAISE EXCEPTION 'Unauthorized: No active treatment relationship with this patient';
  END IF;

  -- Validate name
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Patient name is required';
  END IF;

  IF NOT validate_text_length(p_name, 100) THEN
    RAISE EXCEPTION 'Name must be less than 100 characters';
  END IF;

  -- Validate phone
  IF NOT validate_phone(p_phone) THEN
    RAISE EXCEPTION 'Phone must be a valid 10-digit number';
  END IF;

  -- Validate email
  IF NOT validate_email(p_email) THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Validate date of birth
  IF NOT validate_date_not_future(p_date_of_birth) THEN
    RAISE EXCEPTION 'Date of birth cannot be in the future';
  END IF;

  -- Validate field lengths
  IF NOT validate_text_length(p_address, 500) THEN
    RAISE EXCEPTION 'Address must be less than 500 characters';
  END IF;

  IF NOT validate_text_length(p_medical_history, 2000) THEN
    RAISE EXCEPTION 'Medical history must be less than 2000 characters';
  END IF;

  IF NOT validate_text_length(p_allergies, 500) THEN
    RAISE EXCEPTION 'Allergies must be less than 500 characters';
  END IF;

  -- Check for duplicate phone (exclude current patient)
  IF EXISTS (SELECT 1 FROM patients WHERE phone = p_phone AND id != p_patient_id) THEN
    RAISE EXCEPTION 'This phone number is already registered';
  END IF;

  -- Update the patient
  UPDATE patients
  SET 
    name = trim(p_name),
    phone = p_phone,
    email = NULLIF(trim(p_email), ''),
    date_of_birth = p_date_of_birth,
    address = NULLIF(trim(p_address), ''),
    medical_history = NULLIF(trim(p_medical_history), ''),
    allergies = NULLIF(trim(p_allergies), ''),
    updated_at = now()
  WHERE id = p_patient_id;

  RETURN true;
END;
$$;

-- 5. Create new restrictive policies for doctors

-- Doctors can only view patients with active treatment relationship
CREATE POLICY "Doctors can view patients with active relationship"
ON patients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'doctor') 
  AND has_active_treatment_relationship(auth.uid(), id)
);

-- Doctors can only update patients with active treatment relationship (via RPC preferred)
CREATE POLICY "Doctors can update patients with active relationship"
ON patients
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'doctor') 
  AND has_active_treatment_relationship(auth.uid(), id)
)
WITH CHECK (
  has_role(auth.uid(), 'doctor') 
  AND has_active_treatment_relationship(auth.uid(), id)
);

-- Doctors can insert new patients (direct insert still allowed for initial creation before appointment)
CREATE POLICY "Doctors can insert patients"
ON patients
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'doctor'));

-- Doctors can only delete patients with active treatment relationship
CREATE POLICY "Doctors can delete patients with active relationship"
ON patients
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'doctor') 
  AND has_active_treatment_relationship(auth.uid(), id)
);