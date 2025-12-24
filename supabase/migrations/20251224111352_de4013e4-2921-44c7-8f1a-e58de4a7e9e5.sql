-- Create inventory table for medicines, tools, and supplies
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'medicine',
  description TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'units',
  reorder_level INTEGER NOT NULL DEFAULT 10,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  expiry_date DATE,
  doctor_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for doctor access only
CREATE POLICY "Doctors can view their own inventory" 
ON public.inventory 
FOR SELECT 
USING (has_role(auth.uid(), 'doctor'::app_role) AND doctor_id = auth.uid());

CREATE POLICY "Doctors can insert their own inventory" 
ON public.inventory 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role) AND doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own inventory" 
ON public.inventory 
FOR UPDATE 
USING (has_role(auth.uid(), 'doctor'::app_role) AND doctor_id = auth.uid());

CREATE POLICY "Doctors can delete their own inventory" 
ON public.inventory 
FOR DELETE 
USING (has_role(auth.uid(), 'doctor'::app_role) AND doctor_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();