
-- ============== APP SETTINGS ==============
CREATE TABLE public.app_settings (
  app_key text NOT NULL,
  setting_key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (app_key, setting_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_app_settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============== TAGS ==============
CREATE TABLE public.crm_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  cor text NOT NULL DEFAULT '#2C6FEA',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tags TO authenticated;
GRANT ALL ON public.crm_tags TO service_role;
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_tags" ON public.crm_tags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============== CONVERSATIONS ==============
CREATE TABLE public.crm_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  telefone text NOT NULL UNIQUE,
  nome text,
  app_context text NOT NULL DEFAULT 'mapa',  -- mapa | protocolo | derma
  status text NOT NULL DEFAULT 'ativo',       -- ativo | aguardando | resolvido | escalado
  modo text NOT NULL DEFAULT 'ia',            -- ia | humano
  ultima_mensagem text,
  ultima_mensagem_em timestamptz,
  nao_lidas integer NOT NULL DEFAULT 0,
  tags uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_conversations_status_idx ON public.crm_conversations(status);
CREATE INDEX crm_conversations_updated_idx ON public.crm_conversations(updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_conversations TO authenticated;
GRANT ALL ON public.crm_conversations TO service_role;
ALTER TABLE public.crm_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_conversations" ON public.crm_conversations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER crm_conversations_updated
  BEFORE UPDATE ON public.crm_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== MESSAGES ==============
CREATE TABLE public.crm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.crm_conversations(id) ON DELETE CASCADE,
  direcao text NOT NULL CHECK (direcao IN ('in', 'out')),
  autor text NOT NULL DEFAULT 'ia',    -- lead | ia | humano | sistema
  conteudo text NOT NULL,
  status text NOT NULL DEFAULT 'enviado', -- enviado | falhou | entregue | lido | recebido
  erro text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_messages_conv_idx ON public.crm_messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_messages TO authenticated;
GRANT ALL ON public.crm_messages TO service_role;
ALTER TABLE public.crm_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_messages" ON public.crm_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============== FUNNELS ==============
CREATE TABLE public.crm_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  app_key text NOT NULL DEFAULT 'mapa',    -- mapa | protocolo | derma
  gatilho_tipo text NOT NULL DEFAULT 'manual', -- manual | mapa_completo | tag | dia_desafio
  gatilho_valor text,
  ativo boolean NOT NULL DEFAULT true,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{ id, tipo, ... }]
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_funnels TO authenticated;
GRANT ALL ON public.crm_funnels TO service_role;
ALTER TABLE public.crm_funnels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_funnels" ON public.crm_funnels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER crm_funnels_updated
  BEFORE UPDATE ON public.crm_funnels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== FUNNEL EXECUTIONS ==============
CREATE TABLE public.crm_funnel_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL REFERENCES public.crm_funnels(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.crm_conversations(id) ON DELETE CASCADE,
  step_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'agendado',   -- agendado | rodando | pausado | concluido | erro
  proximo_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_funnel_runs_proximo_idx ON public.crm_funnel_runs(proximo_em) WHERE status = 'agendado';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_funnel_runs TO authenticated;
GRANT ALL ON public.crm_funnel_runs TO service_role;
ALTER TABLE public.crm_funnel_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_runs" ON public.crm_funnel_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER crm_funnel_runs_updated
  BEFORE UPDATE ON public.crm_funnel_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed tags padrão
INSERT INTO public.crm_tags (nome, cor) VALUES
  ('Novo lead', '#2C6FEA'),
  ('Quente', '#E85D75'),
  ('Aguardando resposta', '#F2C14E'),
  ('Cliente Derma', '#0B2A4A')
ON CONFLICT (nome) DO NOTHING;
