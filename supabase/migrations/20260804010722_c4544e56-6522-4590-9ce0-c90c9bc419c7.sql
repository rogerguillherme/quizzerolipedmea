CREATE TABLE IF NOT EXISTS public.integrations_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  config_key TEXT NOT NULL,
  value TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, config_key)
);

GRANT ALL ON public.integrations_config TO service_role;

ALTER TABLE public.integrations_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations_config service only" ON public.integrations_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);