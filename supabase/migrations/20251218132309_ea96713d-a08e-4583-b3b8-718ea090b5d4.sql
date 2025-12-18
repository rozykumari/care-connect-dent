-- Create patient prescriptions table
CREATE TABLE public.patient_prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose TEXT NOT NULL,
  time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patient procedures table
CREATE TABLE public.patient_procedures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patient allergies table
CREATE TABLE public.patient_allergies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allergen TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'mild',
  action_to_take TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_allergies ENABLE ROW LEVEL SECURITY;

-- RLS policies for prescriptions
CREATE POLICY "Users can view their own prescriptions" ON public.patient_prescriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own prescriptions" ON public.patient_prescriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prescriptions" ON public.patient_prescriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prescriptions" ON public.patient_prescriptions FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for procedures
CREATE POLICY "Users can view their own procedures" ON public.patient_procedures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own procedures" ON public.patient_procedures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own procedures" ON public.patient_procedures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own procedures" ON public.patient_procedures FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for allergies
CREATE POLICY "Users can view their own allergies" ON public.patient_allergies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own allergies" ON public.patient_allergies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own allergies" ON public.patient_allergies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own allergies" ON public.patient_allergies FOR DELETE USING (auth.uid() = user_id);