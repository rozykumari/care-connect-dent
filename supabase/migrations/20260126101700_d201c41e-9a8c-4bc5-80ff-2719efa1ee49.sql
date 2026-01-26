-- Add server-side input validation to existing functions

-- Create validation helper functions
CREATE OR REPLACE FUNCTION public.validate_phone(phone_input text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Validate phone is exactly 10 digits
  RETURN phone_input IS NOT NULL AND phone_input ~ '^\d{10}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Allow NULL or valid email format
  IF email_input IS NULL OR email_input = '' THEN
    RETURN true;
  END IF;
  -- Basic email format validation
  RETURN email_input ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_date_not_future(date_input date)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Allow NULL or dates not in the future
  IF date_input IS NULL THEN
    RETURN true;
  END IF;
  RETURN date_input <= CURRENT_DATE;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_date_not_past(date_input date)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  -- Dates must be today or in the future
  RETURN date_input >= CURRENT_DATE;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_text_length(text_input text, max_length integer)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF text_input IS NULL THEN
    RETURN true;
  END IF;
  RETURN length(text_input) <= max_length;
END;
$$;

-- Update book_appointment with validation
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_patient_id uuid,
  p_date date,
  p_time time without time zone,
  p_type text DEFAULT 'consultation'::text,
  p_notes text DEFAULT NULL::text,
  p_duration integer DEFAULT 30,
  p_family_member_id uuid DEFAULT NULL::uuid
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
  -- Validate date is not in the past
  IF NOT validate_date_not_past(p_date) THEN
    RAISE EXCEPTION 'Appointment date cannot be in the past';
  END IF;

  -- Validate appointment type
  IF p_type NOT IN ('checkup', 'cleaning', 'filling', 'extraction', 'root-canal', 'consultation', 'follow-up') THEN
    RAISE EXCEPTION 'Invalid appointment type';
  END IF;

  -- Validate duration is reasonable (15-120 minutes)
  IF p_duration < 15 OR p_duration > 120 THEN
    RAISE EXCEPTION 'Duration must be between 15 and 120 minutes';
  END IF;

  -- Validate notes length
  IF NOT validate_text_length(p_notes, 1000) THEN
    RAISE EXCEPTION 'Notes must be less than 1000 characters';
  END IF;

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

-- Update create_appointment with validation
CREATE OR REPLACE FUNCTION public.create_appointment(
  p_patient_id uuid,
  p_doctor_id uuid,
  p_date date,
  p_time time without time zone,
  p_type text DEFAULT 'consultation'::text,
  p_duration integer DEFAULT 30,
  p_notes text DEFAULT NULL::text,
  p_family_member_id uuid DEFAULT NULL::uuid
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
  -- Validate date is not in the past
  IF NOT validate_date_not_past(p_date) THEN
    RAISE EXCEPTION 'Appointment date cannot be in the past';
  END IF;

  -- Validate appointment type
  IF p_type NOT IN ('checkup', 'cleaning', 'filling', 'extraction', 'root-canal', 'consultation', 'follow-up') THEN
    RAISE EXCEPTION 'Invalid appointment type';
  END IF;

  -- Validate duration is reasonable (15-120 minutes)
  IF p_duration < 15 OR p_duration > 120 THEN
    RAISE EXCEPTION 'Duration must be between 15 and 120 minutes';
  END IF;

  -- Validate notes length
  IF NOT validate_text_length(p_notes, 1000) THEN
    RAISE EXCEPTION 'Notes must be less than 1000 characters';
  END IF;

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

-- Create a validated patient update function
CREATE OR REPLACE FUNCTION public.update_patient_profile(
  p_patient_id uuid,
  p_name text,
  p_phone text,
  p_address text DEFAULT NULL,
  p_date_of_birth date DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM patients 
    WHERE id = p_patient_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update this patient';
  END IF;

  -- Validate required fields
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;

  IF NOT validate_text_length(p_name, 100) THEN
    RAISE EXCEPTION 'Name must be less than 100 characters';
  END IF;

  IF NOT validate_phone(p_phone) THEN
    RAISE EXCEPTION 'Phone must be a valid 10-digit number';
  END IF;

  -- Validate date of birth is not in the future
  IF NOT validate_date_not_future(p_date_of_birth) THEN
    RAISE EXCEPTION 'Date of birth cannot be in the future';
  END IF;

  -- Validate address length
  IF NOT validate_text_length(p_address, 500) THEN
    RAISE EXCEPTION 'Address must be less than 500 characters';
  END IF;

  -- Check phone uniqueness (exclude current patient)
  IF EXISTS (
    SELECT 1 FROM patients 
    WHERE phone = p_phone AND id != p_patient_id
  ) THEN
    RAISE EXCEPTION 'This phone number is already registered';
  END IF;

  -- Update patient
  UPDATE patients
  SET 
    name = trim(p_name),
    phone = p_phone,
    address = p_address,
    date_of_birth = p_date_of_birth,
    updated_at = now()
  WHERE id = p_patient_id AND user_id = auth.uid();

  -- Also update profile
  UPDATE profiles
  SET
    full_name = trim(p_name),
    phone = p_phone,
    updated_at = now()
  WHERE user_id = auth.uid();

  RETURN true;
END;
$$;