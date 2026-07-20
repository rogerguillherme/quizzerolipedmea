# Plano — Zero Lipedema v2 (identidade + conteúdo real)

Sequência aprovada: Design System → Landing/Mapa → Ingestão dos documentos → Protocolo 7 dias com IA.

## Etapa 1 — Identidade visual (logo + tokens)

1. Gerar o **logo Zero Lipedema** (gota azul degradê + wordmark) como asset:
   - `src/assets/logo-zero-lipedema.svg.asset.json` (via `imagegen` premium com fundo transparente + `lovable-assets`).
   - Versão OG social 1200×630 com o layout "Obrigada!" para compartilhamento (`src/assets/og-zero-lipedema.png.asset.json`).
   - Favicon derivado (só a gota) em `public/favicon.png`; remover `public/favicon.ico`.
2. Reescrever tokens em `src/styles.css`:
   - `--primary` → azul-marinho profundo `#0B2A4A` (headlines).
   - `--brand` (novo) → azul vibrante `#2C6FEA` (CTAs, destaques, links).
   - `--brand-soft` → `#EAF1FB` (cards de destaque, chips de ícone).
   - Fundo `#F5F8FD` (off-white azulado).
   - Aposentar `--coral` (o design final é 100% azul, sem coral).
   - Fonte display: `Fraunces` (serif elegante) para headlines "Obrigada!" / "Mapa" / "Método"; body continua `Nunito`.
3. Atualizar `__root.tsx` para carregar Fraunces via `<link>` e apontar `og:image` para o novo asset (leaf routes).

## Etapa 2 — Landing + Mapa com nova identidade

- `src/routes/index.tsx`: hero com logo em gota + headline serif + CTA "Fazer o Mapa gratuito" em azul vibrante. Cards com ícones em círculo `brand-soft`.
- `src/routes/mapa.tsx`: quiz do Mapa mantido, mas repaginado (chips azuis, barra de progresso `brand`, tela de resultado com layout "Obrigada!" — logo + headline serif + card destacando "Seu Mapa está pronto" + CTA WhatsApp).
- `src/routes/index.tsx` da área logada (`app.index.tsx`): tela do lead recebido com resultado do Mapa + "Iniciar Protocolo 7 dias".

## Etapa 3 — Ingestão dos documentos (base de conhecimento)

Parsear os 7 `.docx` em `/mnt/user-uploads/` e criar:

1. **Migration** — 4 novas tabelas + policies + grants:
   - `anamneses` (lead_id, respostas jsonb, exames_urls, status ∈ pendente/analisada/aprovada, plano_gerado jsonb, aprovado_por, aprovado_em).
   - `protocolos_7dias` (lead_id, refeicao_alvo, refeicao_escolhida jsonb, lista_compras jsonb, iniciado_em, dia_atual, concluido_em).
   - `feedbacks_diarios` (protocolo_id, dia, sono, intestino, humor, seguiu_plano bool, foto_url, observacoes, criado_em).
   - `kb_documentos` (slug, titulo, categoria, conteudo_md, atualizado_em) — armazena texto extraído dos 7 documentos como base para a IA.
2. Server function `src/lib/kb.server.ts` para carregar trechos relevantes do `kb_documentos` (Manual Mestre, Cardápios Regionais, Melhores/Piores Alimentos, Catálogo Prescrição) e injetar como contexto no prompt da IA.
3. Seed dos documentos via server function admin-only (rodada uma vez a partir de `/admin`).

## Etapa 4 — Protocolo 7 dias com IA

- Formulário multi-step em `src/routes/app.protocolo.tsx`:
  1. Sono (qualidade + horas).
  2. Intestino (regularidade — perguntas leves: "Você costuma ir ao banheiro todo dia sem esforço?").
  3. Dificuldades na alimentação.
  4. Maior dificuldade com lipedema.
  5. Já treina?
  6. Primeiro tratamento?
  7. Qual refeição substituir (café / almoço / lanche / jantar).
- Ao selecionar a refeição: `gerar_refeicoes.functions.ts` chama Gemini 3 Flash com contexto dos documentos → 3 opções regionais + shot/chá sugerido.
- Usuária escolhe uma → protocolo criado com lista de compras automática.
- `app.protocolo.$dia.tsx`: check-in diário + link para feedback WhatsApp.
- Dia 7: relatório de aderência + vídeo Gabriela (placeholder) + CTA para o plano Premium (anamnese completa).

## Etapa 5 — /admin com controle completo

- Autenticação real (email/senha) + tabela `user_roles` (admin).
- Abas: Leads · Anamneses (aprovar/editar plano gerado) · Protocolos 7d · Financeiro · Evolution API · Base de conhecimento.
- Ação "Gerar plano" na anamnese: chama IA com exames + respostas + KB → nutri revisa e aprova.

## Detalhes técnicos

- IA via `LOVABLE_API_KEY` + Gemini 3 Flash (default) para geração de refeições/planos; upgrade para `gemini-3.1-pro-preview` no plano Premium (análise de exames).
- Storage bucket `exames` (privado, RLS por owner) para upload de PDFs/imagens de exames.
- WhatsApp continua com link `wa.me` até Evolution API ser plugada em `/admin`.
- Todo texto de sistema segue o guia acolhedor já em uso.

## O que faço agora (primeiras 3 ações desta etapa)

1. Gerar logo + favicon + OG image e subir como asset.
2. Reescrever `src/styles.css` com a nova paleta 100% azul + Fraunces.
3. Parsear os 7 documentos e mostrar um resumo por documento antes de escrever a migration da KB.

Depois disso continuo direto até o fim das 5 etapas, mostrando progresso ao final de cada uma.