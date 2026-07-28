-- 1. Tambah kolum 'cancelled_by' untuk merekod siapa yang batalkan tempahan
ALTER TABLE public.booking_records ADD COLUMN IF NOT EXISTS cancelled_by character varying;
ALTER TABLE public.treatment_records ADD COLUMN IF NOT EXISTS cancelled_by character varying;
ALTER TABLE public.oncall_records ADD COLUMN IF NOT EXISTS cancelled_by character varying;

-- 2. Tambah kolum 'jenis_cuti' pada staff_leaves
ALTER TABLE public.staff_leaves ADD COLUMN IF NOT EXISTS jenis_cuti character varying DEFAULT 'Biasa';

-- 3. Kemaskini Syarat CHECK pada 'status' untuk membenarkan 'Batal' di dalam jadual tempahan
-- Perhatian: Jika jadual anda sudah mempunyai kekangan (constraint) dengan nama tertentu, ia perlu didrop dahulu.
-- Biasanya, nama kekangan adalah seperti 'booking_records_status_check'
ALTER TABLE public.booking_records DROP CONSTRAINT IF EXISTS booking_records_status_check;
ALTER TABLE public.booking_records ADD CONSTRAINT booking_records_status_check CHECK (status::text = ANY (ARRAY['Belum'::text, 'Selesai'::text, 'Batal'::text]));

ALTER TABLE public.oncall_records DROP CONSTRAINT IF EXISTS oncall_records_status_check;
ALTER TABLE public.oncall_records ADD CONSTRAINT oncall_records_status_check CHECK (status::text = ANY (ARRAY['Belum'::text, 'Selesai'::text, 'Batal'::text]));

-- Untuk treatment_records (tada check constraint secara default, tapi kita boleh paksakan)
ALTER TABLE public.treatment_records DROP CONSTRAINT IF EXISTS treatment_records_status_check;
ALTER TABLE public.treatment_records ADD CONSTRAINT treatment_records_status_check CHECK (status::text = ANY (ARRAY['Belum'::text, 'Selesai'::text, 'Batal'::text]));
