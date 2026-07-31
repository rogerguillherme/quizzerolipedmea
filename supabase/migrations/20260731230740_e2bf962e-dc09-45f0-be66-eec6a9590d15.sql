UPDATE public.profiles
SET nome = 'Maria',
    diagnostico = jsonb_set(
      diagnostico,
      '{proximoPassoTitulo}',
      to_jsonb('Seu Mapa do Lipedema está pronto, Maria.'::text),
      true
    ),
    updated_at = now()
WHERE id = '7e56cc6a-542b-49c5-b347-5f0ce287bfed';