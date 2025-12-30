-- Drop the existing check constraint
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS valid_payment_status;

-- Add the updated check constraint that includes 'partial'
ALTER TABLE public.payments ADD CONSTRAINT valid_payment_status 
CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded', 'partial'));