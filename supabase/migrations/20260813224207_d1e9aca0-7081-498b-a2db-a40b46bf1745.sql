ALTER TABLE public.crm_conversations
  ADD COLUMN IF NOT EXISTS etapa text NOT NULL DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS etapa_manual boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS crm_conversations_etapa_idx ON public.crm_conversations (etapa);