ALTER TABLE public.booking_records ADD COLUMN IF NOT EXISTS resit_selesai text null;
ALTER TABLE public.treatment_records ADD COLUMN IF NOT EXISTS resit_selesai text null;
ALTER TABLE public.oncall_records ADD COLUMN IF NOT EXISTS resit_selesai text null;
