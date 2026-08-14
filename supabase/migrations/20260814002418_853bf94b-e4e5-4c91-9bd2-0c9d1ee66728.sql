ALTER TABLE public.crm_messages
  ADD COLUMN IF NOT EXISTS midia_path text,
  ADD COLUMN IF NOT EXISTS midia_tipo text;