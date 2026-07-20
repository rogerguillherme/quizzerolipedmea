
DROP POLICY IF EXISTS "public_can_insert_leads" ON public.leads;

CREATE POLICY "public_can_insert_leads"
  ON public.leads FOR INSERT
  TO anon
  WITH CHECK (
    char_length(trim(nome)) BETWEEN 1 AND 120
    AND char_length(trim(telefone)) BETWEEN 8 AND 40
    AND status = 'mapa_gerado'
    AND diagnostico IS NULL
    AND origem IN ('mapa', 'landing')
  );
