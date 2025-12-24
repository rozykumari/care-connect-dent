-- Add enum constraints for severity and status fields
ALTER TABLE patient_allergies
ADD CONSTRAINT valid_severity CHECK (severity IN ('mild', 'moderate', 'severe'));

ALTER TABLE patient_procedures
ADD CONSTRAINT valid_status CHECK (status IN ('planned', 'in-progress', 'completed'));

-- Add length constraints for patient_prescriptions
ALTER TABLE patient_prescriptions
ADD CONSTRAINT reasonable_prescription_name_length CHECK (length(name) BETWEEN 1 AND 200),
ADD CONSTRAINT reasonable_dose_length CHECK (length(dose) BETWEEN 1 AND 100);

-- Add length constraints for patient_procedures
ALTER TABLE patient_procedures
ADD CONSTRAINT reasonable_procedure_name_length CHECK (length(name) BETWEEN 1 AND 200),
ADD CONSTRAINT reasonable_procedure_description_length CHECK (description IS NULL OR length(description) <= 1000);

-- Add length constraints for patient_allergies
ALTER TABLE patient_allergies
ADD CONSTRAINT reasonable_allergen_length CHECK (length(allergen) BETWEEN 1 AND 200),
ADD CONSTRAINT reasonable_action_length CHECK (action_to_take IS NULL OR length(action_to_take) <= 500);

-- Add constraints for appointments table
ALTER TABLE appointments
ADD CONSTRAINT valid_appointment_type CHECK (type IN ('checkup', 'cleaning', 'consultation', 'follow-up', 'treatment', 'emergency')),
ADD CONSTRAINT valid_appointment_status CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
ADD CONSTRAINT reasonable_notes_length CHECK (notes IS NULL OR length(notes) <= 1000);

-- Prevent double booking of same time slot (rate limiting measure)
ALTER TABLE appointments
ADD CONSTRAINT unique_appointment_slot UNIQUE (doctor_id, date, time);

-- Add length constraints for patients table
ALTER TABLE patients
ADD CONSTRAINT reasonable_patient_name_length CHECK (length(name) BETWEEN 1 AND 200),
ADD CONSTRAINT reasonable_phone_length CHECK (length(phone) BETWEEN 1 AND 50),
ADD CONSTRAINT reasonable_address_length CHECK (address IS NULL OR length(address) <= 500),
ADD CONSTRAINT reasonable_medical_history_length CHECK (medical_history IS NULL OR length(medical_history) <= 5000),
ADD CONSTRAINT reasonable_patient_allergies_length CHECK (allergies IS NULL OR length(allergies) <= 500);

-- Add length constraints for inventory
ALTER TABLE inventory
ADD CONSTRAINT reasonable_inventory_name_length CHECK (length(name) BETWEEN 1 AND 200),
ADD CONSTRAINT reasonable_inventory_description_length CHECK (description IS NULL OR length(description) <= 1000);

-- Add constraints for payments
ALTER TABLE payments
ADD CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
ADD CONSTRAINT valid_payment_method CHECK (method IN ('cash', 'card', 'upi', 'insurance', 'other')),
ADD CONSTRAINT reasonable_payment_description_length CHECK (description IS NULL OR length(description) <= 500);

-- Add length constraints for profiles
ALTER TABLE profiles
ADD CONSTRAINT reasonable_fullname_length CHECK (full_name IS NULL OR length(full_name) <= 200),
ADD CONSTRAINT reasonable_profile_phone_length CHECK (phone IS NULL OR length(phone) <= 50);