ALTER TABLE public.haircuts DROP CONSTRAINT haircuts_kategori_check;

ALTER TABLE public.haircuts ADD CONSTRAINT haircuts_kategori_check CHECK (
  (kategori)::text = any (
    array[
      'Booking'::character varying,
      'Walk-in'::character varying,
      'Treatment Walk-in'::character varying,
      'On-Call'::character varying
    ]
  )
);