// Cron hourly: cadência pré-compra + cadência da Rotina (pós-compra).
// Chamado por pg_cron via pg_net (ver migração scheduled_cron_tick).
// Endpoint público — validamos com apikey (anon key do Supabase).
//
// PROTEÇÃO DO NÚMERO (prioridade sobre a copy):
// - nada de rajada: 8-25s entre mensagens, 30-60s entre partes da mesma mensagem
// - teto de 60 mensagens por execução (a régua é idempotente, o resto fica pra hora seguinte)
// - 429 / rate limit derruba o lote inteiro, que retoma no tique seguinte
// - horário próprio por lead (8h + hash(id) % 120 min) em vez de 8h em ponto pra todo mundo
// - 3 variantes de texto por mensagem, escolhidas pelo hash do lead
import { createFileRoute } from "@tanstack/react-router";
import { dicaParaDia } from "@/lib/dicas-rotina";
import { hojeISO, isoLocal, diasEntre, minutoDoDiaLocal } from "@/lib/data-local";
import {
  PRE_POS20H,
  PRE_POS44H,
  PRE_POS68H,
  PRE_POS6D,
  ROT_ACESSO_4H,
  ROT_DICA,
  ROT_RETOMADA,
  ROT_SEMANA,
  ROT_CONCLUSAO,
  mensagemPara,
  offsetMinutosDoLead,
  type MensagemCadencia,
} from "@/lib/cadencia-copy";

const MS_HORA = 60 * 60 * 1000;
const MS_DIA = 24 * MS_HORA;

/** Janela de envio (minutos desde a meia-noite, São Paulo): 08h00 até 11h00. */
const JANELA_INICIO_MIN = 8 * 60;
const JANELA_FIM_MIN = 11 * 60;

/** Teto de mensagens por execução do cron. */
const LOTE_MAX = 60;
/** Intervalo entre mensagens de leads diferentes. */
const PAUSA_MIN_MS = 8_000;
const PAUSA_MAX_MS = 25_000;
/** Intervalo entre as partes de uma mesma mensagem. */
const PARTE_MIN_MS = 30_000;
const PARTE_MAX_MS = 60_000;

/** Máximo de tentativas por passo antes de desistir daquele passo. */
const MAX_FALHAS_POR_PASSO = 3;

type Jornada = {
  ativa?: boolean;
  iniciado_em?: string;
  dias_enviados?: number[];
  feedback?: Record<string, string>;
  ultimo_feedback_em?: string;
};

type LeadResp = Record<string, unknown> & {
  jornada_7dias?: Jornada;
  atencao?: { motivo?: string; criado_em?: string } | unknown;
  reengaje?: Record<string, string>;
  envio_falhas?: Record<string, number>;
};

/** Estado compartilhado do lote em uma execução do cron. */
type Lote = {
  enviadas: number;
  abortado: boolean;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function aleatorio(minMs: number, maxMs: number) {
  return Math.floor(minMs + Math.random() * (maxMs - minMs));
}

/** Lead está dentro do horário próprio dele (8h + offset, até 11h)? */
function leadNaJanela(leadId: string, minutoAgora: number): boolean {
  const inicio = JANELA_INICIO_MIN + offsetMinutosDoLead(leadId);
  return minutoAgora >= inicio && minutoAgora < JANELA_FIM_MIN;
}

/** Detecta resposta da Evolution indicando que o número não existe no WhatsApp. */
function numeroInexistente(erro?: string): boolean {
  if (!erro) return false;
  const e = erro.toLowerCase().replace(/\s+/g, "");
  return (
    e.includes('"exists":false') ||
    e.includes("exists:false") ||
    e.includes("numbernotexists") ||
    e.includes("notexistsonwhatsapp")
  );
}

/** Erro de limite de taxa: para o lote inteiro imediatamente. */
function erroRateLimit(erro?: string): boolean {
  if (!erro) return false;
  const e = erro.toLowerCase();
  return (
    e.includes("429") ||
    e.includes("rate limit") ||
    e.includes("rate-limit") ||
    e.includes("too many requests")
  );
}

/** Lead marcado como número inválido — deve ser ignorado em toda a cadência. */
function leadInvalido(respostas: LeadResp): boolean {
  const a = respostas.atencao as { motivo?: string } | undefined;
  return a?.motivo === "numero_invalido";
}

type ResultadoEnvio = {
  ok: boolean;
  /** true quando atingiu o teto de falhas: gravar a flag mesmo assim e parar. */
  desistir: boolean;
  /** true quando o número não existe: pular o lead inteiro. */
  invalido: boolean;
  /** true quando o lote foi abortado (rate limit / teto): não gravar flag. */
  abortado: boolean;
};

/**
 * Único ponto de envio das duas cadências. Cuida de:
 * - espaçamento aleatório entre mensagens (8-25s) e entre partes (30-60s)
 * - quebra em várias mensagens quando o texto traz o separador `---`
 * - teto de lote e parada imediata em rate limit
 * - contador de falhas por passo e marcação de número inexistente
 * Sempre registra em `whatsapp_logs`.
 */
async function enviarComControle(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  sendWhatsApp: (t: string, m: string) => Promise<{ ok: boolean; error?: string }>,
  lead: { id: string; telefone: string },
  respostas: LeadResp,
  chave: string,
  mensagem: string,
  lote: Lote,
): Promise<ResultadoEnvio> {
  const partes = mensagem
    .split(/^\s*---\s*$/m)
    .map((p) => p.trim())
    .filter(Boolean);

  for (let i = 0; i < partes.length; i++) {
    if (lote.abortado || lote.enviadas >= LOTE_MAX) {
      return { ok: false, desistir: false, invalido: false, abortado: true };
    }

    // Nada de rajada: espera antes de cada envio (menos no primeiro do lote).
    if (lote.enviadas > 0) {
      await sleep(
        i === 0
          ? aleatorio(PAUSA_MIN_MS, PAUSA_MAX_MS)
          : aleatorio(PARTE_MIN_MS, PARTE_MAX_MS),
      );
    }

    const texto = partes[i]!;
    const wa = await sendWhatsApp(lead.telefone, texto);
    lote.enviadas += 1;

    await supabaseAdmin.from("whatsapp_logs").insert({
      telefone: lead.telefone,
      mensagem: texto,
      status: wa.ok ? "enviado" : "falhou",
      erro: wa.error ?? null,
    });

    if (wa.ok) continue;

    if (erroRateLimit(wa.error)) {
      lote.abortado = true;
      return { ok: false, desistir: false, invalido: false, abortado: true };
    }

    if (numeroInexistente(wa.error)) {
      respostas.atencao = {
        motivo: "numero_invalido",
        criado_em: new Date().toISOString(),
        detalhe: (wa.error ?? "").slice(0, 200),
      };
      await supabaseAdmin
        .from("leads")
        .update({ respostas: respostas as never })
        .eq("id", lead.id);
      return { ok: false, desistir: true, invalido: true, abortado: false };
    }

    const falhas = { ...(respostas.envio_falhas ?? {}) };
    falhas[chave] = (falhas[chave] ?? 0) + 1;
    respostas.envio_falhas = falhas;
    const desistir = (falhas[chave] ?? 0) >= MAX_FALHAS_POR_PASSO;

    await supabaseAdmin
      .from("leads")
      .update({ respostas: respostas as never })
      .eq("id", lead.id);

    return { ok: false, desistir, invalido: false, abortado: false };
  }

  return { ok: true, desistir: false, invalido: false, abortado: false };
}

/** Monta o texto da variante do lead. */
function copy(
  msg: MensagemCadencia,
  leadId: string,
  vars: Record<string, string | number> = {},
) {
  return mensagemPara(msg, leadId, vars);
}

function diasDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / MS_DIA);
}

type Entrada = { em: string; texto: string };

/**
 * Respostas recebidas nas últimas 48h, indexadas pelos 8 últimos dígitos do
 * telefone. Vínculo `leads.telefone` ↔ `crm_conversations.telefone`: o webhook
 * da Evolution grava o número normalizado (55DDD9XXXXXXXX) e o lead pode ter
 * sido cadastrado com máscara ou sem o nono dígito, então casamos pelo sufixo.
 */
async function carregarEntradasRecentes(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
): Promise<Map<string, Entrada>> {
  const mapa = new Map<string, Entrada>();
  const corte = new Date(Date.now() - JANELA_PAUSA_MS).toISOString();

  const { data: convs } = await supabaseAdmin
    .from("crm_conversations")
    .select("id, telefone, ultima_mensagem_em")
    .gt("ultima_mensagem_em", corte)
    .limit(1000);

  const porId = new Map<string, string>();
  for (const c of convs ?? []) porId.set(c.id as string, c.telefone as string);
  if (porId.size === 0) return mapa;

  const { data: msgs } = await supabaseAdmin
    .from("crm_messages")
    .select("conversation_id, conteudo, created_at")
    .in("conversation_id", Array.from(porId.keys()))
    .eq("direcao", "in")
    .gt("created_at", corte)
    .order("created_at", { ascending: false })
    .limit(2000);

  for (const m of msgs ?? []) {
    const tel = porId.get(m.conversation_id as string);
    if (!tel) continue;
    const k = chaveTelefone(tel);
    if (!k) continue;
    const anterior = mapa.get(k);
    const registro: Entrada = {
      em: m.created_at as string,
      texto: String(m.conteudo ?? ""),
    };
    // Guardamos a mais recente, mas qualquer mensagem com intenção prevalece.
    if (!anterior) mapa.set(k, registro);
    else if (temIntencaoCompra(registro.texto) && !temIntencaoCompra(anterior.texto))
      mapa.set(k, registro);
  }

  return mapa;
}

/** Marca a pausa da régua no lead (visível no admin). */
async function marcarPausa(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  leadId: string,
  respostas: LeadResp,
  em: string,
) {
  if (respostas.cadencia_pausada_em === em) return;
  respostas.cadencia_pausada_em = em;
  await supabaseAdmin
    .from("leads")
    .update({ respostas: respostas as never })
    .eq("id", leadId);
}


/**
 * Régua pré-venda. Quatro toques, cada lead no horário próprio dele:
 *   +20h  · convite pro teste grátis de foto (primeira mensagem: se apresenta)
 *   +44h  · quebra de objeção ("já tentei de tudo")
 *   +68h  · oferta do Plano Premium (R$67)
 *   +6d   · última chamada
 * Cada toque é idempotente via `respostas.reengaje`.
 */
async function processarReengajamento(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  sendWhatsApp: (t: string, m: string) => Promise<{ ok: boolean; error?: string }>,
  lote: Lote,
) {
  const enviados: string[] = [];
  const agoraMin = minutoDoDiaLocal();
  if (agoraMin < JANELA_INICIO_MIN || agoraMin >= JANELA_FIM_MIN) return enviados;

  const CHECKOUT_URL = "https://pay.kiwify.com.br/j0hsxv3";

  // Referência de tempo: leads em "mapa_gerado" podem nunca ter updated_at tocado,
  // então usamos created_at pra elas.
  const refTempo = (lead: { status?: string; created_at?: string; updated_at?: string }) =>
    new Date(
      (lead.status === "acesso_criado" ? lead.updated_at : lead.created_at) ??
        lead.created_at ??
        lead.updated_at ??
        0,
    ).getTime();

  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("id, nome, telefone, respostas, status, created_at, updated_at")
    .in("status", ["mapa_gerado", "acesso_criado"])
    .neq("telefone", "pendente")
    // Nunca gastamos chamada de API com número que já sabemos ser inexistente.
    .or(
      "respostas->atencao->>motivo.is.null,respostas->atencao->>motivo.neq.numero_invalido",
    )
    .gt("created_at", new Date(Date.now() - 14 * MS_DIA).toISOString())
    .limit(500);

  for (const lead of leads ?? []) {
    if (lote.abortado || lote.enviadas >= LOTE_MAX) break;

    const respostas = (lead.respostas ?? {}) as LeadResp;
    if (leadInvalido(respostas)) continue;
    if (!leadNaJanela(lead.id, agoraMin)) continue;

    const reengaje = respostas.reengaje ?? {};
    const digits = String(lead.telefone ?? "").replace(/\D/g, "");
    if (digits.length < 10) continue;

    const idade = Date.now() - refTempo(lead);
    const nome = (lead.nome || "").split(" ")[0] || "";
    // Abertura completa só na primeira mensagem que a lead recebe.
    const primeira = Object.keys(reengaje).length === 0;
    const oi = nome ? `Oi ${nome}` : "Oi";
    const vocativo = primeira ? "" : nome ? `${nome}, ` : "";
    const teste = (respostas.teste_fotos as { usadas?: number } | undefined) ?? {};
    const jaTestouFoto = Number(teste.usadas ?? 0) > 0;

    // Um toque por lead por execução: escolhemos o mais recente devido.
    let chave: string | null = null;
    let msg = "";
    const vars = { oi, nome: vocativo, link: CHECKOUT_URL };

    if (idade >= 6 * MS_DIA && !reengaje.pos6d_at) {
      chave = PRE_POS6D.chave;
      msg = copy(PRE_POS6D, lead.id, vars);
    } else if (idade >= 68 * MS_HORA && !reengaje.pos48h_at) {
      chave = PRE_POS68H.chave;
      msg = copy(PRE_POS68H, lead.id, vars);
    } else if (idade >= 44 * MS_HORA && !reengaje.pos2h_foto_at) {
      chave = PRE_POS44H.chave;
      msg = copy(PRE_POS44H, lead.id, vars);
    } else if (idade >= 20 * MS_HORA && !reengaje.pos1h_at && !jaTestouFoto) {
      chave = PRE_POS20H.chave;
      msg = copy(PRE_POS20H, lead.id, vars);
    }

    if (!chave) continue;

    const r = await enviarComControle(
      supabaseAdmin,
      sendWhatsApp,
      lead as { id: string; telefone: string },
      respostas,
      chave,
      msg,
      lote,
    );

    if (r.abortado) break;

    // Sucesso ou teto de falhas atingido: grava a flag e não tenta mais esse passo.
    if (r.ok || r.desistir) {
      reengaje[chave] = new Date().toISOString();
      respostas.reengaje = reengaje;
      await supabaseAdmin
        .from("leads")
        .update({ respostas: respostas as never })
        .eq("id", lead.id);
      if (r.ok) enviados.push(lead.id);
    }
  }

  return enviados;
}

/**
 * Cadência pós-compra da Rotina Zero Lipedema (`status = 'plano_ativo'`).
 *
 * Cinco tipos de toque, todos idempotentes por `respostas.rotina_msgs` e
 * limitados a UMA mensagem por lead por dia (`ultimo_envio`, data local):
 *   1. D0 + 4h  · lembrete de acesso (entre 08h e 21h, para não acordar ninguém)
 *   2. Diário   · dica do dia, no horário próprio do lead (8h + offset)
 *   3. Retomada · 2+ dias sem check-in, no máximo a cada 3 dias
 *   4. Semana   · fechamento de cada semana concluída
 *   5. Final    · conclusão dos 28 dias + convite do Método Derma (R$297)
 */
async function processarCadenciaRotina(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  sendWhatsApp: (t: string, m: string) => Promise<{ ok: boolean; error?: string }>,
  lote: Lote,
) {
  const resultados: Array<{ lead: string; tipo: string; status: string }> = [];

  const agoraMin = minutoDoDiaLocal();
  const janelaDia = agoraMin >= JANELA_INICIO_MIN && agoraMin < 21 * 60;
  if (!janelaDia) return resultados;

  const hoje = hojeISO();

  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("id, nome, telefone, respostas, user_id, updated_at, created_at")
    .eq("status", "plano_ativo")
    .neq("telefone", "pendente")
    // Ignora números já marcados como inexistentes no WhatsApp.
    .or(
      "respostas->atencao->>motivo.is.null,respostas->atencao->>motivo.neq.numero_invalido",
    )
    .limit(500);

  for (const lead of leads ?? []) {
    if (lote.abortado || lote.enviadas >= LOTE_MAX) break;

    const respostas = (lead.respostas ?? {}) as LeadResp;
    if (leadInvalido(respostas)) continue;

    const msgs =
      (respostas.rotina_msgs as
        | {
            inicio?: string;
            ultimo_envio?: string;
            acesso_4h?: string;
            dias_enviados?: number[];
            semanas_fechadas?: number[];
            retomada_em?: string;
            conclusao?: string;
          }
        | undefined) ?? {};

    // Uma mensagem por lead por dia, sem exceção.
    if (msgs.ultimo_envio === hoje) continue;

    const inicioISO =
      msgs.inicio ?? lead.updated_at ?? lead.created_at ?? new Date().toISOString();
    const inicio = new Date(inicioISO);
    const horasDesdeCompra = (Date.now() - inicio.getTime()) / MS_HORA;
    const dia = Math.floor(horasDesdeCompra / 24) + 1;

    const nome = (lead.nome || "").split(" ")[0] || "";
    const ola = nome ? `${nome}, ` : "";

    let tipo: string | null = null;
    let msg = "";
    const proximo = { ...msgs, inicio: inicioISO };
    // Horário próprio do lead para os toques da manhã.
    const janelaManha = leadNaJanela(lead.id, agoraMin);

    // 1. Lembrete de acesso — 4h depois da compra.
    if (!msgs.acesso_4h && horasDesdeCompra >= 4) {
      tipo = "acesso_4h";
      msg = copy(ROT_ACESSO_4H, lead.id, { nome: ola });
      proximo.acesso_4h = new Date().toISOString();
    } else if (janelaManha) {
      // Estado real da Rotina: semana vivida e último check-in.
      let semanaAtual = Math.min(4, Math.max(1, Math.ceil(dia / 7)));
      let ultimoCheckin: string | null = null;
      let totalCheckins = 0;

      if (lead.user_id) {
        const { data: prog } = await supabaseAdmin
          .from("rotina_progresso")
          .select("semana_atual")
          .eq("user_id", lead.user_id)
          .maybeSingle();
        if (prog?.semana_atual) {
          semanaAtual = Math.min(4, Math.max(1, Number(prog.semana_atual)));
        }

        const { data: checkins } = await supabaseAdmin
          .from("rotina_checkins")
          .select("data")
          .eq("user_id", lead.user_id)
          .order("data", { ascending: false })
          .limit(50);
        totalCheckins = checkins?.length ?? 0;
        ultimoCheckin = (checkins?.[0]?.data as string | undefined) ?? null;
      }

      const diasSemCheckin = ultimoCheckin ? diasEntre(hoje, ultimoCheckin) : dia - 1;

      const semanasFechadas = new Set<number>(proximo.semanas_fechadas ?? []);
      const semanaConcluida = Math.min(4, Math.floor(dia / 7));
      const diasEnviados = new Set<number>(proximo.dias_enviados ?? []);

      if (dia > 28 && !msgs.conclusao) {
        // 5. Conclusão dos 28 dias + convite do plano de R$297.
        tipo = "conclusao";
        msg = copy(ROT_CONCLUSAO, lead.id, { nome: ola });
        proximo.conclusao = new Date().toISOString();
      } else if (
        semanaConcluida >= 1 &&
        semanaConcluida <= 4 &&
        !semanasFechadas.has(semanaConcluida)
      ) {
        // 4. Fechamento de semana.
        const foco = ["o café da manhã", "o almoço", "o lanche", "o jantar"][
          semanaConcluida - 1
        ]!;
        const proximaFoco = ["o almoço", "o lanche", "o jantar", ""][
          semanaConcluida - 1
        ]!;
        tipo = `semana_${semanaConcluida}`;
        msg = copy(ROT_SEMANA, lead.id, {
          nome: ola,
          semana: semanaConcluida,
          foco,
          proximo: proximaFoco
            ? `A partir de agora a gente ajusta ${proximaFoco}, mantendo o que você já conquistou. Abre a aba Rotina pra ver a missão nova.`
            : `Abre a aba Progresso pra ver sua sequência completa.`,
        });
        semanasFechadas.add(semanaConcluida);
        proximo.semanas_fechadas = Array.from(semanasFechadas).sort((a, b) => a - b);
      } else if (diasSemCheckin >= 2 && totalCheckins > 0) {
        // 3. Retomada — no máximo a cada 3 dias.
        const ultimaRetomada = proximo.retomada_em
          ? diasEntre(hoje, isoLocal(new Date(proximo.retomada_em)))
          : 99;
        if (ultimaRetomada >= 3) {
          tipo = "retomada";
          msg = copy(ROT_RETOMADA, lead.id, { nome: ola, dias: diasSemCheckin });
          proximo.retomada_em = new Date().toISOString();
        }
      }

      // 2. Dica do dia — só se nada mais importante foi disparado.
      if (!tipo && dia >= 1 && dia <= 28 && !diasEnviados.has(dia)) {
        const dica = dicaParaDia(dia, semanaAtual);
        if (dica) {
          tipo = `dica_${dia}`;
          msg = copy(ROT_DICA, lead.id, { nome: ola, dia, dica: dica.texto });
          diasEnviados.add(dia);
          proximo.dias_enviados = Array.from(diasEnviados).sort((a, b) => a - b);
        }
      }
    }

    if (!tipo || !msg) continue;

    const r = await enviarComControle(
      supabaseAdmin,
      sendWhatsApp,
      lead as { id: string; telefone: string },
      respostas,
      `rotina_${tipo}`,
      msg,
      lote,
    );

    if (r.abortado) break;

    if (r.ok || r.desistir) {
      // Teto de falhas: grava as flags do passo assim mesmo e segue em frente.
      proximo.ultimo_envio = hoje;
      respostas.rotina_msgs = proximo;
      await supabaseAdmin
        .from("leads")
        .update({ respostas: respostas as never })
        .eq("id", lead.id);
      resultados.push({
        lead: lead.id,
        tipo,
        status: r.ok ? "enviado" : r.invalido ? "numero_invalido" : "desistiu",
      });
    } else {
      resultados.push({ lead: lead.id, tipo, status: "falhou" });
    }
  }

  return resultados;
}

export const Route = createFileRoute("/api/public/hooks/cron-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Segurança mínima: exige apikey igual à anon key do projeto.
        const apiKey = request.headers.get("apikey") ?? "";
        const expected =
          process.env.SUPABASE_PUBLISHABLE_KEY ??
          process.env.SUPABASE_ANON_KEY ??
          "";
        if (!expected || apiKey !== expected) {
          return new Response("unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { sendWhatsApp } = await import("@/lib/evolution.server");

        // Lote compartilhado: teto e parada por rate limit valem para as duas cadências.
        const lote: Lote = { enviadas: 0, abortado: false };

        const reengajados = await processarReengajamento(
          supabaseAdmin,
          sendWhatsApp,
          lote,
        );
        const rotina = await processarCadenciaRotina(
          supabaseAdmin,
          sendWhatsApp,
          lote,
        );

        return Response.json({
          ok: true,
          reengajados,
          rotina,
          enviadas: lote.enviadas,
          abortado: lote.abortado,
          ts: new Date().toISOString(),
        });
      },
      GET: async () =>
        Response.json({ service: "Zero Lipedema · Cron tick", ok: true }),
    },
  },
});
