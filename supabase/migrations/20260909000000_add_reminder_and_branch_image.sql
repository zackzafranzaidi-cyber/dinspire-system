-- Tambah lajur gambar ke jadual branches
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS gambar text;

-- Tambah lajur reminder_sent ke jadual tempahan
ALTER TABLE public.booking_records ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;
ALTER TABLE public.treatment_records ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;
ALTER TABLE public.oncall_records ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;
