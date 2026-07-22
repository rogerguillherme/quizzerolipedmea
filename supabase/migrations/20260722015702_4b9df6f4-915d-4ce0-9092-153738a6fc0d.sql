-- Perfis de leads (usuárias que passaram no Mapa e receberam acesso)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  telefone text NOT NULL,
  perfil text,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  diagnostico jsonb,
  senha_temporaria boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile_read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "own_profile_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Log de envios via Evolution API
CREATE TABLE public.whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone text NOT NULL,
  mensagem text NOT NULL,
  status text NOT NULL,
  erro text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.whatsapp_logs TO service_role;
GRANT SELECT ON public.whatsapp_logs TO authenticated;

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_whatsapp_logs"
  ON public.whatsapp_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Config Evolution API (única linha, singleton, admin only)
CREATE TABLE public.evolution_config (
  id integer PRIMARY KEY DEFAULT 1,
  base_url text,
  instance_name text,
  connected boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);

GRANT ALL ON public.evolution_config TO service_role;
GRANT SELECT, UPDATE ON public.evolution_config TO authenticated;

ALTER TABLE public.evolution_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_evolution"
  ON public.evolution_config FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.evolution_config (id, base_url, instance_name)
VALUES (1, '', 'zero-lipedema');

CREATE TRIGGER evolution_config_updated_at
  BEFORE UPDATE ON public.evolution_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Adiciona coluna user_id em leads para vincular ao auth user criado
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;