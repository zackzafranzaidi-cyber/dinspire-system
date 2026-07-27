-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.owners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT owners_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT admins_pkey PRIMARY KEY (id)
);
CREATE TABLE public.staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  jenis_staf character varying CHECK (jenis_staf::text = ANY (ARRAY['In-Branch'::character varying, 'On-Call'::character varying, 'General'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  branch_id character varying,
  must_change_password boolean DEFAULT true,
  reset_requested boolean DEFAULT false,
  can_haircut boolean DEFAULT true,
  can_treatment boolean DEFAULT true,
  CONSTRAINT staff_pkey PRIMARY KEY (id)
);
CREATE TABLE public.branches (
  id character varying NOT NULL,
  nama_cawangan character varying NOT NULL,
  lokasi text,
  lat numeric,
  lng numeric,
  CONSTRAINT branches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  gambar text,
  nama character varying NOT NULL,
  harga numeric NOT NULL,
  stok integer DEFAULT 0,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.haircuts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kategori character varying CHECK (kategori::text = ANY (ARRAY['Booking'::character varying, 'Walk-in'::character varying, 'On-Call'::character varying]::text[])),
  nama_potongan character varying NOT NULL,
  diskripsi text,
  harga numeric NOT NULL,
  CONSTRAINT haircuts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.treatments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama_rawatan character varying NOT NULL,
  diskripsi text,
  harga numeric NOT NULL,
  CONSTRAINT treatments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.staff_performance (
  staff_id uuid NOT NULL,
  peratus_kehadiran integer DEFAULT 100,
  peratus_review integer DEFAULT 100,
  total_komisen_rm numeric DEFAULT 0.00,
  total_pelanggan integer DEFAULT 0,
  total_sales_rm numeric DEFAULT 0.00,
  total_cash_on_hand numeric DEFAULT 0.00,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT staff_performance_pkey PRIMARY KEY (staff_id),
  CONSTRAINT staff_performance_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id)
);
CREATE TABLE public.punch_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid,
  nama character varying,
  tarikh date NOT NULL,
  hari character varying,
  waktu_in time without time zone,
  waktu_out time without time zone,
  lokasi text,
  cawangan character varying,
  CONSTRAINT punch_cards_pkey PRIMARY KEY (id),
  CONSTRAINT punch_cards_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id)
);
CREATE TABLE public.booking_records (
  no_booking character varying NOT NULL,
  nama_pelanggan character varying,
  no_phone character varying,
  tarikh date,
  masa time without time zone,
  jenis_haircut uuid,
  staff_id uuid,
  harga_rm numeric,
  resit text,
  status character varying DEFAULT 'Belum'::character varying CHECK (status::text = ANY (ARRAY['Belum'::character varying, 'Selesai'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  service_fee numeric DEFAULT 0,
  CONSTRAINT booking_records_pkey PRIMARY KEY (no_booking),
  CONSTRAINT booking_records_jenis_haircut_fkey FOREIGN KEY (jenis_haircut) REFERENCES public.haircuts(id),
  CONSTRAINT booking_records_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id)
);
CREATE TABLE public.walkin_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama_pelanggan character varying,
  no_phone character varying,
  tarikh date,
  masa time without time zone,
  jenis_potongan uuid,
  staff_id uuid,
  harga_rm numeric,
  jenis_bayaran character varying CHECK (jenis_bayaran::text = ANY (ARRAY['Cash'::character varying, 'QR'::character varying]::text[])),
  resit text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  service_fee numeric DEFAULT 0,
  CONSTRAINT walkin_records_pkey PRIMARY KEY (id),
  CONSTRAINT walkin_records_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id),
  CONSTRAINT walkin_records_jenis_potongan_fkey FOREIGN KEY (jenis_potongan) REFERENCES public.haircuts(id)
);
CREATE TABLE public.oncall_records (
  no_booking character varying NOT NULL,
  nama_pelanggan character varying,
  tarikh date,
  masa time without time zone,
  lokasi text,
  jenis_haircut uuid,
  staff_id uuid,
  harga_rm numeric,
  resit text,
  status character varying DEFAULT 'Belum'::character varying CHECK (status::text = ANY (ARRAY['Belum'::character varying, 'Selesai'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  service_fee numeric DEFAULT 0,
  CONSTRAINT oncall_records_pkey PRIMARY KEY (no_booking),
  CONSTRAINT oncall_records_jenis_haircut_fkey FOREIGN KEY (jenis_haircut) REFERENCES public.haircuts(id),
  CONSTRAINT oncall_records_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id)
);
CREATE TABLE public.product_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama_pembeli character varying,
  tarikh date,
  masa time without time zone,
  senarai_produk jsonb,
  lokasi_penghantaran text,
  resit text,
  status character varying DEFAULT 'Proses'::character varying CHECK (status::text = ANY (ARRAY['Preparing'::character varying, 'Shipped'::character varying, 'Delivered'::character varying, 'Baru'::character varying, 'Belum'::character varying, 'Selesai'::character varying, 'Batal'::character varying]::text[])),
  no_tracking character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  tracking_no character varying,
  shipping_fee numeric DEFAULT 0,
  CONSTRAINT product_orders_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  no_booking character varying NOT NULL,
  bintang integer CHECK (bintang >= 1 AND bintang <= 5),
  review_text text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reviews_pkey PRIMARY KEY (id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  phone character varying NOT NULL UNIQUE,
  address text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  password_hash text,
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.otps (
  phone character varying NOT NULL,
  otp_code character varying NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT otps_pkey PRIMARY KEY (phone)
);
CREATE TABLE public.settings (
  setting_key character varying NOT NULL,
  setting_value text NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT settings_pkey PRIMARY KEY (setting_key)
);
CREATE TABLE public.treatment_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  no_booking character varying UNIQUE,
  nama_pelanggan character varying,
  no_phone character varying,
  tarikh character varying,
  masa character varying,
  jenis_rawatan uuid,
  staff_id uuid,
  harga_rm numeric,
  resit text,
  status character varying DEFAULT 'Belum'::character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  service_fee numeric DEFAULT 0,
  CONSTRAINT treatment_records_pkey PRIMARY KEY (id),
  CONSTRAINT treatment_records_jenis_rawatan_fkey FOREIGN KEY (jenis_rawatan) REFERENCES public.treatments(id),
  CONSTRAINT treatment_records_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id)
);


CREATE TABLE public.staff_leaves (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  tarikh date NOT NULL,
  sebab text,
  status character varying DEFAULT 'Approved',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT staff_leaves_pkey PRIMARY KEY (id),
  CONSTRAINT staff_leaves_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id)
);

CREATE TABLE public.historical_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tahun integer NOT NULL,
  bulan integer NOT NULL,
  total_jualan_servis numeric DEFAULT 0,
  total_jualan_produk numeric DEFAULT 0,
  total_pelanggan integer DEFAULT 0,
  top_staff jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT historical_sales_pkey PRIMARY KEY (id)
);
