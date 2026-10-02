-- 1. Cipta Jadual Buku Telefon Berpusat (Master Directory)
CREATE TABLE IF NOT EXISTS public.customer_directory (
    phone_number TEXT PRIMARY KEY,
    real_name TEXT NOT NULL,
    first_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tarik semula (Backfill) data dari pendaftaran pelanggan sedia ada
INSERT INTO public.customer_directory (phone_number, real_name, first_created_at)
SELECT 
    CASE 
        WHEN phone LIKE '0%' THEN '6' || phone
        WHEN phone LIKE '+60%' THEN substring(phone from 2)
        WHEN phone NOT LIKE '60%' THEN '60' || phone
        ELSE phone
    END as formatted_phone, 
    name, 
    created_at 
FROM public.customers
WHERE phone IS NOT NULL AND phone != ''
ON CONFLICT (phone_number) DO NOTHING;

-- 3. Tarik semula (Backfill) data dari Walk-in terdahulu
INSERT INTO public.customer_directory (phone_number, real_name, first_created_at)
SELECT 
    CASE 
        WHEN no_phone LIKE '0%' THEN '6' || no_phone
        WHEN no_phone LIKE '+60%' THEN substring(no_phone from 2)
        WHEN no_phone NOT LIKE '60%' THEN '60' || no_phone
        ELSE no_phone
    END as formatted_phone, 
    nama_pelanggan, 
    created_at 
FROM public.walkin_records
WHERE no_phone IS NOT NULL AND no_phone != '-' AND no_phone NOT LIKE 'TIADA-%'
ON CONFLICT (phone_number) DO NOTHING;

-- (Pilihan) Benarkan akses staf jika ada RLS
-- ALTER TABLE public.customer_directory ENABLE ROW LEVEL SECURITY;
-- Anda tidak semestinya perlukan RLS di sini kerana Backend menggunakan service_role
