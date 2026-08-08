ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mapa_popup_visto_em timestamptz NULL,
  ADD COLUMN IF NOT EXISTS mapa_popup_aberturas integer NOT NULL DEFAULT 0;