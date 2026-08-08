CREATE TABLE public.rotina_progresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  semana_atual int NOT NULL DEFAULT 1 CHECK (semana_atual BETWEEN 1 AND 4),
  iniciada_em timestamptz NOT NULL DEFAULT now(),
  concluida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rotina_progresso TO authenticated;
GRANT ALL ON public.rotina_progresso TO service_role;

ALTER TABLE public.rotina_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_rotina_progresso" ON public.rotina_progresso
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_read_rotina_progresso" ON public.rotina_progresso
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER rotina_progresso_updated_at
  BEFORE UPDATE ON public.rotina_progresso
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.rotina_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semana int NOT NULL CHECK (semana BETWEEN 1 AND 4),
  data date NOT NULL DEFAULT current_date,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, data)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rotina_checkins TO authenticated;
GRANT ALL ON public.rotina_checkins TO service_role;

ALTER TABLE public.rotina_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_rotina_checkins" ON public.rotina_checkins
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_read_rotina_checkins" ON public.rotina_checkins
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX rotina_checkins_user_data_idx ON public.rotina_checkins (user_id, data DESC);