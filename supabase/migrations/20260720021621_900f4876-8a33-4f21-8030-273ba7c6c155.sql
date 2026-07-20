
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  idade INTEGER,
  respostas JSONB NOT NULL DEFAULT '{}'::jsonb,
  diagnostico JSONB,
  origem TEXT DEFAULT 'mapa',
  status TEXT NOT NULL DEFAULT 'mapa_gerado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_telefone ON public.leads(telefone);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

GRANT INSERT, SELECT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Público pode criar um lead (formulário do Mapa é aberto). Não pode ler nem editar.
CREATE POLICY "public_can_insert_leads"
  ON public.leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Só service_role/edge lê. Nutri (admin) usa auth futura.
CREATE POLICY "service_role_all"
  ON public.leads FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
