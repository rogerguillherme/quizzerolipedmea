
CREATE TABLE public.exames_leituras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  telefone text,
  nome_arquivo text NOT NULL,
  storage_path text NOT NULL,
  mimetype text NOT NULL,
  tamanho_bytes integer,
  observacao_usuaria text,
  ia_status text NOT NULL DEFAULT 'pendente' CHECK (ia_status IN ('pendente','processando','ok','erro')),
  ia_resumo text,
  ia_itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  ia_erro text,
  ia_modelo text,
  ia_processado_em timestamptz,
  revisao_status text NOT NULL DEFAULT 'aguardando' CHECK (revisao_status IN ('aguardando','aprovado','editado','recusado','enviado')),
  revisao_texto text,
  revisado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revisado_em timestamptz,
  enviado_em timestamptz,
  enviado_status text,
  enviado_erro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.exames_leituras TO authenticated;
GRANT ALL ON public.exames_leituras TO service_role;

ALTER TABLE public.exames_leituras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_exames_read"
  ON public.exames_leituras FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "own_exames_insert"
  ON public.exames_leituras FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_read_exames"
  ON public.exames_leituras FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins_update_exames"
  ON public.exames_leituras FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER exames_leituras_updated_at
BEFORE UPDATE ON public.exames_leituras
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_exames_user ON public.exames_leituras(user_id, created_at DESC);
CREATE INDEX idx_exames_revisao ON public.exames_leituras(revisao_status, created_at DESC);

-- Storage RLS: usuária vê apenas o próprio prefixo `{user_id}/...`, admins veem tudo.
CREATE POLICY "exames_user_read_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'exames' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "exames_user_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'exames' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "exames_admin_read_all"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'exames' AND public.has_role(auth.uid(), 'admin'::app_role));
