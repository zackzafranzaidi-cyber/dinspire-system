CREATE TABLE public.general_staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  must_change_password boolean DEFAULT true,
  reset_requested boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT general_staff_pkey PRIMARY KEY (id)
);
GRANT ALL ON TABLE public.general_staff TO postgres, anon, authenticated, service_role;