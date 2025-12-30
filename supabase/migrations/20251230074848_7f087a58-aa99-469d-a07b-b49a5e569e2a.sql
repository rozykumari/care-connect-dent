-- Add balance_amount and due_date columns to payments table for partial payments
ALTER TABLE public.payments 
ADD COLUMN balance_amount numeric DEFAULT 0,
ADD COLUMN due_date date DEFAULT NULL,
ADD COLUMN paid_amount numeric DEFAULT NULL;

-- Update existing records to set paid_amount equal to amount (fully paid)
UPDATE public.payments SET paid_amount = amount WHERE paid_amount IS NULL;