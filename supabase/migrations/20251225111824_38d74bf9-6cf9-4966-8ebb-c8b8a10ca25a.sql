-- Drop existing constraint and add updated one with all appointment types
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS valid_appointment_type;

ALTER TABLE public.appointments ADD CONSTRAINT valid_appointment_type 
CHECK (type = ANY (ARRAY['checkup'::text, 'cleaning'::text, 'consultation'::text, 'follow-up'::text, 'treatment'::text, 'emergency'::text, 'filling'::text, 'extraction'::text, 'root-canal'::text]));