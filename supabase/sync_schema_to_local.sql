-- 1. Staff columns
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS can_haircut boolean DEFAULT true;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS can_treatment boolean DEFAULT true;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS status_pekerja text DEFAULT 'Tetap';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS seen_leaves_count INT DEFAULT 0;

-- 2. Branches columns
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS gambar text;

-- 3. Booking records columns
ALTER TABLE public.booking_records ADD COLUMN IF NOT EXISTS resit_selesai text null;
ALTER TABLE public.booking_records ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;

-- 4. Treatment records columns
ALTER TABLE public.treatment_records ADD COLUMN IF NOT EXISTS jenis_bayaran text null;
ALTER TABLE public.treatment_records ADD COLUMN IF NOT EXISTS resit_selesai text null;
ALTER TABLE public.treatment_records ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;

-- 5. Oncall records columns
ALTER TABLE public.oncall_records ADD COLUMN IF NOT EXISTS resit_selesai text null;
ALTER TABLE public.oncall_records ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;

-- 6. Owners columns
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS seen_tx_servis INT DEFAULT 0;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS seen_tx_produk INT DEFAULT 0;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS seen_reviews INT DEFAULT 0;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS seen_wa INT DEFAULT 0;

-- 7. Haircuts category constraint
ALTER TABLE public.haircuts DROP CONSTRAINT IF EXISTS haircuts_kategori_check;
ALTER TABLE public.haircuts ADD CONSTRAINT haircuts_kategori_check CHECK (
  (kategori)::text = ANY (ARRAY['Booking'::character varying, 'Walk-in'::character varying, 'Treatment Walk-in'::character varying, 'On-Call'::character varying]::text[])
);

-- 8. Edit requests table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS public.edit_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_table TEXT NOT NULL, 
    transaction_id UUID NOT NULL, 
    staff_id UUID REFERENCES staff(id),
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2),
    old_payment_method TEXT,
    new_payment_method TEXT,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Grants for Supabase API access
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 10. Notify postgrest schema reload
NOTIFY pgrst, 'reload schema';
