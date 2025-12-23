-- Create patients table for storing patient records
CREATE TABLE public.patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    date_of_birth DATE,
    address TEXT,
    medical_history TEXT,
    allergies TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctor_availability table for doctor's available time slots
CREATE TABLE public.doctor_availability (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(doctor_id, day_of_week, start_time)
);

-- Create appointments table with proper relations
CREATE TABLE public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    type TEXT NOT NULL DEFAULT 'checkup',
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    method TEXT NOT NULL DEFAULT 'cash',
    status TEXT NOT NULL DEFAULT 'pending',
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Patients RLS policies
CREATE POLICY "Doctors can view all patients"
ON public.patients FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can insert patients"
ON public.patients FOR INSERT
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can update patients"
ON public.patients FOR UPDATE
USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can delete patients"
ON public.patients FOR DELETE
USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Patients can view their own record"
ON public.patients FOR SELECT
USING (auth.uid() = user_id);

-- Doctor availability RLS policies
CREATE POLICY "Doctors can manage their own availability"
ON public.doctor_availability FOR ALL
USING (has_role(auth.uid(), 'doctor'::app_role) AND auth.uid() = doctor_id);

CREATE POLICY "Anyone authenticated can view doctor availability"
ON public.doctor_availability FOR SELECT
USING (is_active = true);

-- Appointments RLS policies
CREATE POLICY "Doctors can view all appointments"
ON public.appointments FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can manage all appointments"
ON public.appointments FOR ALL
USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Patients can view their own appointments"
ON public.appointments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.patients p 
        WHERE p.id = patient_id AND p.user_id = auth.uid()
    )
);

CREATE POLICY "Patients can create their own appointments"
ON public.appointments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.patients p 
        WHERE p.id = patient_id AND p.user_id = auth.uid()
    )
);

-- Payments RLS policies
CREATE POLICY "Doctors can view all payments"
ON public.payments FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can manage all payments"
ON public.payments FOR ALL
USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Patients can view their own payments"
ON public.payments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.patients p 
        WHERE p.id = patient_id AND p.user_id = auth.uid()
    )
);

-- Create indexes for performance
CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_doctor_availability_doctor_id ON public.doctor_availability(doctor_id);
CREATE INDEX idx_payments_patient_id ON public.payments(patient_id);

-- Create trigger for updated_at columns
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_availability_updated_at
    BEFORE UPDATE ON public.doctor_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();