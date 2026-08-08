CREATE TABLE public.refeicoes_registros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text,
  feedback jsonb,
  macros jsonb,
  semana int,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.refeicoes_registros TO authenticated;
GRANT ALL ON public.refeicoes_registros TO service_role;

ALTER TABLE public.refeicoes_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_refeicoes_all ON public.refeicoes_registros
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY admins_read_refeicoes ON public.refeicoes_registros
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX refeicoes_registros_user_created_idx
  ON public.refeicoes_registros (user_id, created_at DESC);

-- Storage: cada usuária só acessa a própria pasta {user_id}/... no bucket refeicoes
CREATE POLICY "refeicoes own read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'refeicoes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "refeicoes own insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'refeicoes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "refeicoes own update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'refeicoes' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'refeicoes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "refeicoes own delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'refeicoes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "refeicoes admin read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'refeicoes' AND public.has_role(auth.uid(), 'admin'::app_role));