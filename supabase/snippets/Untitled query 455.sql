ALTER TABLE public.booking_records ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.treatment_records ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.oncall_records ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.product_orders ADD COLUMN IF NOT EXISTS customer_id uuid;