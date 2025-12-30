-- Add prescription_date column to patient_prescriptions table
ALTER TABLE public.patient_prescriptions 
ADD COLUMN prescription_date date NOT NULL DEFAULT CURRENT_DATE;

-- Create an index for faster date-based queries
CREATE INDEX idx_patient_prescriptions_date ON public.patient_prescriptions(prescription_date);
