## Escopo

Transformar o fluxo do Mapa do Lipedema em: **botão elegante na landing → popup com quiz ilustrado → mini-relatório → pré-cadastro automático → acesso ao app personalizado**, com Evolution API pré-configurada na área admin.

## 1. Landing — Botão + Popup

- Redesenhar o CTA principal ("Gerar Meu Mapa 🗺️") com estilo mais refinado: pílula dourada com brilho suave, micro-animação de respiração + hover com leve elevação e shimmer.
- Ao clicar, abre um **Dialog fullscreen (mobile) / modal centralizado (desktop)** com o quiz. A rota `/mapa` continua existindo como fallback direto, mas o fluxo principal fica no popup da home.

## 2. Quiz dentro do popup

- 8 perguntas mantidas (tempo, diagnóstico, sintoma-chave, peso×pernas, dieta, atividade, exames, objetivo) + captura de nome no início e WhatsApp no fim.
- Cada pergunta recebe uma **ilustração temática** (ícone editorial grande em dourado sobre creme, usando Lucide + composição SVG — sem gerar imagens novas, para manter leve e coerente com o estilo editorial).
- Barra de progresso dourada no topo, transição suave entre passos, cards de opção com hover, seleção destacada.

## 3. Mini-relatório final (dentro do popup)

Antes do envio, mostra:
- Abertura validadora personalizada com o nome.
- **Resumo dos 3 sinais principais** identificados (derivados diretamente das respostas — sem IA nesta etapa para ser instantâneo).
- Estágio percebido (Inicial / Intermediário / Avançado) com barra.
- **Botão "Receber Acesso no WhatsApp"** — este é o gatilho do cadastro.

## 4. Pré-cadastro automático + Evolution API

Ao clicar em "Receber Acesso":

1. Server function `criarAcessoMapa`:
   - Cria usuário no Auth com email temporário (`telefone@zerolipedema.app`) e **senha inicial de 8 caracteres gerada** (formato amigável tipo `mapa-4829`).
   - Cria linha em `leads` com status `acesso_criado` + diagnóstico.
   - Cria linha em `profiles` (nova tabela) com nome, telefone, respostas.
   - Envia via **Evolution API** uma mensagem no WhatsApp da lead contendo: link (`/auth`), login (telefone) e senha inicial.
2. Popup mostra tela final: "Enviamos seu acesso no WhatsApp ✓" + botão "Abrir WhatsApp da Gabriela".

## 5. App "Mapa do Lipedema" personalizado (após login)

Rota `_authenticated/app.mapa` reformulada:
- Header colorido com **saudação nominal** ("Olá, Maria 💙") e o perfil identificado.
- **Cards temáticos coloridos** (não só azul — introduz acentos suaves de dourado, coral leve, verde-água) organizados como um guia:
  - "Seu perfil" — leitura do quiz.
  - "3 prioridades da semana" — personalizadas.
  - "Como montar seu prato" — visual ilustrado.
  - "Rotina de hidratação" — dicas.
  - "Chás e shots caseiros" — 3 receitas do catálogo.
  - "Movimento suave" — sugestões conforme nível de atividade respondido.
  - "Próximo passo: Método Derma" — CTA final.
- Tudo lido do `profiles` + `respostas` da lead, então o guia muda conforme o quiz.

## 6. Admin — Evolution API pré-configurado

Nova aba na `/admin` chamada "WhatsApp (Evolution)":
- Campos: URL da instância, API Key, Nome da instância.
- Salvos como **secrets** (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`).
- Botão "Testar conexão" que dispara um `GET /instance/connectionState/{instance}` via server fn.
- Bloco de status: conectado/desconectado, QR code se necessário (link para painel).
- Log das últimas 20 mensagens enviadas (nova tabela `whatsapp_logs`).

## Detalhes técnicos

**Banco (migração):**
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  telefone text NOT NULL,
  perfil text,
  respostas jsonb DEFAULT '{}',
  diagnostico jsonb,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile_read" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE TABLE public.whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone text NOT NULL,
  mensagem text NOT NULL,
  status text NOT NULL,
  erro text,
  created_at timestamptz DEFAULT now()
);
GRANT ALL ON public.whatsapp_logs TO service_role;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
```

**Server functions novas:**
- `criarAcessoMapa` — cria user + profile + envia WhatsApp.
- `enviarWhatsApp` (helper server-only) — POST para Evolution `/message/sendText/{instance}`.
- `testarEvolution` — chamada admin para verificar conexão.

**Secrets a solicitar depois via `add_secret`:**
- `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`.

## Fora do escopo desta iteração

- Fluxo de recuperação de senha custom (usa reset padrão Supabase).
- Método Derma pago (só CTA visual).
- QR Code embutido no admin (link externo por enquanto).

Depois que você aprovar, executo tudo em sequência: migração → server fns → popup na landing → app personalizado → aba admin.