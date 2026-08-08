CREATE TABLE public.eventos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  session_id text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  path text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.eventos TO authenticated;
GRANT ALL ON public.eventos TO service_role;

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_eventos" ON public.eventos
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX eventos_created_at_idx ON public.eventos (created_at DESC);
CREATE INDEX eventos_nome_idx ON public.eventos (nome);
CREATE INDEX eventos_utm_campaign_idx ON public.eventos (utm_campaign);