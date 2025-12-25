-- Add start_date and end_date columns to patient_procedures
ALTER TABLE public.patient_procedures 
ADD COLUMN start_date date,
ADD COLUMN end_date date;

-- Update existing records to use the current date column value for start_date
UPDATE public.patient_procedures SET start_date = date WHERE date IS NOT NULL;