create table public.admins (
  id uuid not null default gen_random_uuid (),
  username character varying(50) not null,
  password_hash text not null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint admins_pkey primary key (id),
  constraint admins_username_key unique (username)
) TABLESPACE pg_default;

create table public.booking_records (
  no_booking character varying(20) not null,
  nama_pelanggan character varying(100) null,
  no_phone character varying(20) null,
  tarikh date null,
  masa time without time zone null,
  jenis_haircut uuid null,
  staff_id uuid null,
  harga_rm numeric(10, 2) null,
  resit text null,
  status character varying(20) null default 'Belum'::character varying,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  service_fee numeric null default 0,
  customer_id uuid null,
  cancelled_by character varying null,
  constraint booking_records_pkey primary key (no_booking),
  constraint unique_booking_slot unique (staff_id, tarikh, masa),
  constraint unique_staff_waktu_booking unique (staff_id, tarikh, masa),
  constraint booking_records_jenis_haircut_fkey foreign KEY (jenis_haircut) references haircuts (id),
  constraint booking_records_staff_id_fkey foreign KEY (staff_id) references staff (id),
  constraint booking_records_status_check check (
    (
      (status)::text = any (
        array[
          'Belum'::text,
          'Selesai'::text,
          'Batal'::text,
          'Pending Verification'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists unique_staff_time_booking_idx on public.booking_records using btree (staff_id, tarikh, masa) TABLESPACE pg_default
where
  ((status)::text <> 'Batal'::text);

create table public.branches (
  id character varying(20) not null,
  nama_cawangan character varying(100) not null,
  lokasi text null,
  lat double precision null,
  lng double precision null,
  constraint branches_pkey primary key (id)
) TABLESPACE pg_default;

create table public.customers (
  id uuid not null default gen_random_uuid (),
  name character varying(100) not null,
  phone character varying(20) not null,
  address text null,
  avatar_url text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  password_hash text null,
  constraint customers_pkey primary key (id),
  constraint customers_phone_key unique (phone)
) TABLESPACE pg_default;

create table public.haircuts (
  id uuid not null default gen_random_uuid (),
  kategori character varying(20) null,
  nama_potongan character varying(100) not null,
  diskripsi text null,
  harga numeric(10, 2) not null,
  constraint haircuts_pkey primary key (id),
  constraint haircuts_kategori_check check (
    (
      (kategori)::text = any (
        (
          array[
            'Booking'::character varying,
            'Walk-in'::character varying,
            'On-Call'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create table public.historical_sales (
  id uuid not null default extensions.uuid_generate_v4 (),
  tahun integer not null,
  bulan integer not null,
  total_jualan_servis numeric(10, 2) null default 0.00,
  total_jualan_produk numeric(10, 2) null default 0.00,
  total_pelanggan integer null default 0,
  top_staff jsonb null,
  created_at timestamp with time zone null default now(),
  constraint historical_sales_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_historical_sales_tahun on public.historical_sales using btree (tahun) TABLESPACE pg_default;

create table public.oncall_records (
  no_booking character varying(20) not null,
  nama_pelanggan character varying(100) null,
  tarikh date null,
  masa time without time zone null,
  lokasi text null,
  jenis_haircut uuid null,
  staff_id uuid null,
  harga_rm numeric(10, 2) null,
  resit text null,
  status character varying(20) null default 'Belum'::character varying,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  service_fee numeric null default 0,
  customer_id uuid null,
  cancelled_by character varying null,
  constraint oncall_records_pkey primary key (no_booking),
  constraint oncall_records_jenis_haircut_fkey foreign KEY (jenis_haircut) references haircuts (id),
  constraint oncall_records_staff_id_fkey foreign KEY (staff_id) references staff (id),
  constraint oncall_records_status_check check (
    (
      (status)::text = any (
        array[
          'Belum'::text,
          'Selesai'::text,
          'Batal'::text,
          'Pending Verification'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists unique_staff_time_oncall_idx on public.oncall_records using btree (staff_id, tarikh, masa) TABLESPACE pg_default
where
  ((status)::text <> 'Batal'::text);

create table public.otps (
  phone character varying(20) not null,
  otp_code character varying(10) not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint otps_pkey primary key (phone)
) TABLESPACE pg_default;

create table public.owners (
  id uuid not null default gen_random_uuid (),
  username character varying(50) not null,
  password_hash text not null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint owners_pkey primary key (id),
  constraint owners_username_key unique (username)
) TABLESPACE pg_default;

create table public.product_orders (
  id uuid not null default gen_random_uuid (),
  nama_pembeli character varying(100) null,
  tarikh date null,
  masa time without time zone null,
  senarai_produk jsonb null,
  lokasi_penghantaran text null,
  resit text null,
  status character varying(50) null default 'Proses'::character varying,
  no_tracking character varying(100) null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  tracking_no character varying(255) null,
  shipping_fee numeric null default 0,
  customer_id uuid null,
  constraint product_orders_pkey primary key (id)
) TABLESPACE pg_default;

create table public.products (
  id uuid not null default gen_random_uuid (),
  gambar text null,
  nama character varying(100) not null,
  harga numeric(10, 2) not null,
  stok integer null default 0,
  constraint products_pkey primary key (id)
) TABLESPACE pg_default;

create table public.punch_cards (
  id uuid not null default gen_random_uuid (),
  staff_id uuid null,
  nama character varying(100) null,
  tarikh date not null,
  hari character varying(20) null,
  waktu_in time without time zone null,
  waktu_out time without time zone null,
  lokasi text null,
  cawangan character varying(100) null,
  constraint punch_cards_pkey primary key (id),
  constraint punch_cards_staff_id_fkey foreign KEY (staff_id) references staff (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.reviews (
  id uuid not null default gen_random_uuid (),
  no_booking character varying(20) not null,
  bintang integer null,
  review_text text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint reviews_pkey primary key (id),
  constraint reviews_bintang_check check (
    (
      (bintang >= 1)
      and (bintang <= 5)
    )
  )
) TABLESPACE pg_default;

create table public.settings (
  setting_key character varying(50) not null,
  setting_value text not null,
  description text null,
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint settings_pkey primary key (setting_key)
) TABLESPACE pg_default;

create table public.staff (
  id uuid not null default gen_random_uuid (),
  username character varying(50) not null,
  password_hash text not null,
  jenis_staf character varying(20) null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  branch_id character varying(255) null,
  must_change_password boolean null default true,
  reset_requested boolean null default false,
  can_haircut boolean null default true,
  can_treatment boolean null default true,
  constraint staff_pkey primary key (id),
  constraint staff_username_key unique (username),
  constraint staff_jenis_staf_check check (
    (
      (jenis_staf)::text = any (
        array[
          ('In-Branch'::character varying)::text,
          ('On-Call'::character varying)::text,
          ('General'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create table public.staff_leaves (
  id uuid not null default gen_random_uuid (),
  staff_id uuid not null,
  branch_id character varying null,
  tarikh date not null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  jenis_cuti character varying null default 'Biasa'::character varying,
  sebab text null,
  status character varying null default 'Approved'::character varying,
  constraint staff_leaves_pkey primary key (id),
  constraint staff_leaves_branch_tarikh_unique unique (branch_id, tarikh),
  constraint staff_leaves_staff_id_fkey foreign KEY (staff_id) references staff (id)
) TABLESPACE pg_default;

create table public.staff_performance (
  staff_id uuid not null,
  peratus_kehadiran integer null default 100,
  peratus_review integer null default 100,
  total_komisen_rm numeric(10, 2) null default 0.00,
  total_pelanggan integer null default 0,
  total_sales_rm numeric(10, 2) null default 0.00,
  total_cash_on_hand numeric(10, 2) null default 0.00,
  last_updated timestamp with time zone null default timezone ('utc'::text, now()),
  constraint staff_performance_pkey primary key (staff_id),
  constraint staff_performance_staff_id_fkey foreign KEY (staff_id) references staff (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.treatment_records (
  id uuid not null default gen_random_uuid (),
  no_booking character varying(255) null,
  nama_pelanggan character varying(255) null,
  no_phone character varying(50) null,
  tarikh character varying(50) null,
  masa character varying(50) null,
  jenis_rawatan uuid null,
  staff_id uuid null,
  harga_rm numeric null,
  resit text null,
  status character varying(50) null default 'Belum'::character varying,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  service_fee numeric null default 0,
  customer_id uuid null,
  cancelled_by character varying null,
  constraint treatment_records_pkey primary key (id),
  constraint unique_treatment_slot unique (staff_id, tarikh, masa),
  constraint unique_staff_waktu_treatment unique (staff_id, tarikh, masa),
  constraint treatment_records_no_booking_key unique (no_booking),
  constraint treatment_records_staff_id_fkey foreign KEY (staff_id) references staff (id),
  constraint treatment_records_jenis_rawatan_fkey foreign KEY (jenis_rawatan) references treatments (id),
  constraint treatment_records_status_check check (
    (
      (status)::text = any (
        array[
          'Belum'::text,
          'Selesai'::text,
          'Batal'::text,
          'Pending Verification'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists unique_staff_time_treatment_idx on public.treatment_records using btree (staff_id, tarikh, masa) TABLESPACE pg_default
where
  ((status)::text <> 'Batal'::text);

create table public.treatments (
  id uuid not null default gen_random_uuid (),
  nama_rawatan character varying(100) not null,
  diskripsi text null,
  harga numeric(10, 2) not null,
  constraint treatments_pkey primary key (id)
) TABLESPACE pg_default;

create table public.walkin_records (
  id uuid not null default gen_random_uuid (),
  nama_pelanggan character varying(100) null,
  no_phone character varying(20) null,
  tarikh date null,
  masa time without time zone null,
  jenis_potongan uuid null,
  staff_id uuid null,
  harga_rm numeric(10, 2) null,
  jenis_bayaran character varying(20) null,
  resit text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  service_fee numeric null default 0,
  constraint walkin_records_pkey primary key (id),
  constraint walkin_records_jenis_potongan_fkey foreign KEY (jenis_potongan) references haircuts (id),
  constraint walkin_records_staff_id_fkey foreign KEY (staff_id) references staff (id),
  constraint walkin_records_jenis_bayaran_check check (
    (
      (jenis_bayaran)::text = any (
        (
          array[
            'Cash'::character varying,
            'QR'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;
