// Cron hourly: cadência do Protocolo (dias 2-7) + reengajamento leve + fila de atenção.
// Chamado por pg_cron via pg_net (ver migração scheduled_cron_tick).
// Endpoint público — validamos com apikey (anon key do Supabase).
import { createFileRoute } from "@tanstack/react-router";
import {
  DICAS_7_DIAS,
  RECEITAS_PRATICAS,
  ESCALONAMENTO_DIAS_SEM_RESPOSTA,
} from "@/lib/protocolo7";
import { dicaParaDia } from "@/lib/dicas-rotina";
import { horaLocal } from "@/lib/data-local";

const MS_HORA = 60 * 60 * 1000;
const MS_DIA = 24 * MS_HORA;
/** Janela de envio (hora local de São Paulo): 08h até 10h. */
const JANELA_INICIO = 8;
const JANELA_FIM = 10;

type Jornada = {
  ativa?: boolean;
  iniciado_em?: string;
  dias_enviados?: number[];
  feedback?: Record<string, string>;
  ultimo_feedback_em?: string;
};

type LeadResp = Record<string, unknown> & { jornada_7dias?: Jornada; atencao?: unknown; reengaje?: Record<string, string> };

function diasDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / MS_DIA);
}

function horasDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / MS_HORA);
}

async function processarCadenciaProtocolo(
  supabaseAdmin: Awaited<ReturnType<typeof import("@/integrations/supabase/client.server").supabaseAdmin.from>> extends never ? never : import("@supabase/supabase-js").SupabaseClient,
  sendWhatsApp: (t: string, m: string) => Promise<{ ok: boolean; error?: string }>,
) {
  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("id, nome, telefone, respostas")
    .eq("status", "protocolo_7d_ativo")
    .limit(500);

  const resultados: Array<{ lead: string; dia?: number; status: string }> = [];

  for (const lead of leads ?? []) {
    const respostas = (lead.respostas ?? {}) as LeadResp;
    const j = respostas.jornada_7dias;
    if (!j?.ativa || !j.iniciado_em) continue;

    const diaAtual = Math.min(7, diasDesde(j.iniciado_em) + 1);
    const enviados = new Set(j.dias_enviados ?? []);

    // Envia todos os dias devidos que ainda não foram enviados (idempotente).
    for (let d = 2; d <= diaAtual; d++) {
      if (enviados.has(d)) continue;
      const dica = DICAS_7_DIAS.find((x) => x.dia === d);
      if (!dica) continue;

      const receita = RECEITAS_PRATICAS.find((r) => r.dia === d);
      const feedbackAnterior = j.feedback?.[String(d - 1)] ? "" :
        `\n\nComo foi ontem? Responde só: *Sim* / *Mais ou menos* / *Não*.`;

      const receitaBloco = receita
        ? `\n\n🥣 *Receita de hoje — ${receita.titulo}*\n${receita.descricao}\n` +
          receita.passos.map((p, i) => `${i + 1}. ${p}`).join("\n")
        : "";

      const msg =
        `Dia ${d} · ${dica.titulo}\n\n${dica.texto}` +
        receitaBloco +
        (d < 7 ? feedbackAnterior : "\n\nHoje é o último dia — dá uma olhada no seu progresso no app 💙");

      const wa = await sendWhatsApp(lead.telefone, msg);
      await supabaseAdmin.from("whatsapp_logs").insert({
        telefone: lead.telefone,
        mensagem: msg,
        status: wa.ok ? "enviado" : "falhou",
        erro: wa.error ?? null,
      });

      if (wa.ok) {
        enviados.add(d);
        j.dias_enviados = Array.from(enviados).sort((a, b) => a - b);
        respostas.jornada_7dias = j;
        await supabaseAdmin
          .from("leads")
          .update({ respostas: respostas as never })
          .eq("id", lead.id);
        resultados.push({ lead: lead.id, dia: d, status: "enviado" });
      } else {
        resultados.push({ lead: lead.id, dia: d, status: "falhou" });
        break; // pra não empilhar mensagens no mesmo lead se a API tá fora
      }
    }

    // Fila de atenção: 3+ dias sem responder feedback.
    const refFeedback = j.ultimo_feedback_em ?? j.iniciado_em;
    if (
      refFeedback &&
      diasDesde(refFeedback) >= ESCALONAMENTO_DIAS_SEM_RESPOSTA &&
      !respostas.atencao
    ) {
      respostas.atencao = {
        motivo: "sem_feedback_3d",
        criado_em: new Date().toISOString(),
      };
      await supabaseAdmin
        .from("leads")
        .update({ respostas: respostas as never })
        .eq("id", lead.id);
    }
  }

  return resultados;
}

/**
 * Régua pré-venda. Quatro toques, todos na janela da manhã (08h-10h de São
 * Paulo) para não mandar mensagem de madrugada:
 *   +20h  · dúvida sobre o Mapa
 *   +44h  · convite pro teste grátis de foto
 *   +68h  · oferta do Plano Premium (R$67)
 *   +6d   · última chamada
 * Cada toque é idempotente via `respostas.reengaje`.
 */
async function processarReengajamento(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  sendWhatsApp: (t: string, m: string) => Promise<{ ok: boolean; error?: string }>,
) {
  const enviados: string[] = [];

  // Fora da janela da manhã não enviamos nada da régua pré-venda.
  const hora = horaLocal();
  if (hora < JANELA_INICIO || hora >= JANELA_FIM) return enviados;

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
    .gt("created_at", new Date(Date.now() - 14 * MS_DIA).toISOString())
    .limit(500);

  for (const lead of leads ?? []) {
    const respostas = (lead.respostas ?? {}) as LeadResp;
    const reengaje = respostas.reengaje ?? {};
    const digits = String(lead.telefone ?? "").replace(/\D/g, "");
    if (digits.length < 10) continue;

    const idade = Date.now() - refTempo(lead);
    const nome = (lead.nome || "").split(" ")[0] || "";
    const oi = nome ? `Oi ${nome}` : "Oi";
    const teste = (respostas.teste_fotos as { usadas?: number } | undefined) ?? {};
    const jaTestouFoto = Number(teste.usadas ?? 0) > 0;

    // Um toque por lead por execução: escolhemos o mais recente devido.
    let chave: string | null = null;
    let msg = "";

    if (idade >= 6 * MS_DIA && !reengaje.pos6d_at) {
      chave = "pos6d_at";
      msg =
        `${oi}, aqui é a Gabriela 💙\n\n` +
        `Essa é a minha última mensagem sobre isso, prometo. O acesso ao *Plano Premium Zero Lipedema* segue por R$67, sem assinatura, com 7 dias de garantia.\n\n` +
        `Se agora não é a hora, tudo bem. Seu Mapa continua valendo e eu sigo por aqui quando você quiser retomar.\n\n` +
        `🔗 ${CHECKOUT_URL}`;
    } else if (idade >= 68 * MS_HORA && !reengaje.pos48h_at) {
      chave = "pos48h_at";
      msg =
        `${oi}, aqui é a Gabriela 💙\n\n` +
        `Voltando pra te fazer um convite direto: hoje eu libero seu acesso ao Plano Premium Zero Lipedema por um valor de inauguração, de R$119 por apenas R$67, sem assinatura obrigatória.\n\n` +
        `O centro do plano é a Rotina Zero Lipedema: a gente ajusta uma refeição por semana, começando pelo café da manhã, sem contar caloria e sem passar fome. E você pode fotografar seu prato pra receber a leitura na hora, o que ajuda, o que atrapalha e o que ajustar na próxima refeição.\n\n` +
        `Tem 7 dias de garantia: se não fizer sentido pra você, é só me chamar que devolvo, sem burocracia. E como bônus, libero todos os meus guias e receitas práticas.\n\n` +
        `🔗 Pra ativar: ${CHECKOUT_URL}\n\n` +
        `Qualquer dúvida, me chama por aqui. ✨`;
    } else if (idade >= 44 * MS_HORA && !reengaje.pos2h_foto_at && !jaTestouFoto) {
      chave = "pos2h_foto_at";
      msg =
        `${oi}! 💙 Aqui é a Gabriela.\n\n` +
        `Tem uma coisa bem legal que você ainda não testou: me manda aqui mesmo, respondendo esta mensagem, uma foto de qualquer refeição sua que eu te dou um feedback na hora, se aquele prato ajuda ou atrapalha o seu quadro.\n\n` +
        `É grátis, são 3 fotos de teste, sem compromisso. É só mandar a foto por aqui. ✨`;
    } else if (idade >= 20 * MS_HORA && !reengaje.pos1h_at) {
      chave = "pos1h_at";
      msg =
        `${oi} 💙 Aqui é a Gabriela.\n\n` +
        `Vi que você fez o seu *Mapa do Lipedema* e recebeu o resultado com as suas 3 prioridades. ` +
        `Passei aqui só pra saber: ficou alguma dúvida sobre o que apareceu no seu Mapa?\n\n` +
        `Pode me perguntar por aqui, eu leio com calma e te respondo. ✨`;
    }

    if (!chave) continue;

    const wa = await sendWhatsApp(lead.telefone, msg);
    await supabaseAdmin.from("whatsapp_logs").insert({
      telefone: lead.telefone,
      mensagem: msg,
      status: wa.ok ? "enviado" : "falhou",
      erro: wa.error ?? null,
    });
    if (wa.ok) {
      reengaje[chave] = new Date().toISOString();
      respostas.reengaje = reengaje;
      await supabaseAdmin
        .from("leads")
        .update({ respostas: respostas as never })
        .eq("id", lead.id);
      enviados.push(lead.id);
    }
  }

  return enviados;
}

/**
 * Cadência pós-compra: uma dica por dia, por 28 dias, para quem está com
 * `plano_ativo`. A dica respeita a semana que a paciente realmente está
 * vivendo na Rotina (não o calendário), e roda na mesma janela da manhã.
 * Idempotência por `respostas.rotina_dicas.dias_enviados`.
 */
async function processarCadenciaRotina(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  sendWhatsApp: (t: string, m: string) => Promise<{ ok: boolean; error?: string }>,
) {
  const resultados: Array<{ lead: string; dia: number; status: string }> = [];

  const hora = horaLocal();
  if (hora < JANELA_INICIO || hora >= JANELA_FIM) return resultados;

  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("id, nome, telefone, respostas, user_id, updated_at, created_at")
    .eq("status", "plano_ativo")
    .neq("telefone", "pendente")
    .limit(500);

  for (const lead of leads ?? []) {
    const respostas = (lead.respostas ?? {}) as LeadResp;
    const controle =
      (respostas.rotina_dicas as
        | { inicio?: string; dias_enviados?: number[] }
        | undefined) ?? {};

    const inicio =
      controle.inicio ?? lead.updated_at ?? lead.created_at ?? new Date().toISOString();
    const dia = diasDesde(inicio) + 1;
    if (dia < 1 || dia > 28) continue;

    const enviados = new Set(controle.dias_enviados ?? []);
    if (enviados.has(dia)) continue;

    // Semana vivida de verdade: se ela não avançou, não recebe conteúdo adiantado.
    let semanaAtual = Math.min(4, Math.ceil(dia / 7));
    if (lead.user_id) {
      const { data: prog } = await supabaseAdmin
        .from("rotina_progresso")
        .select("semana_atual")
        .eq("user_id", lead.user_id)
        .maybeSingle();
      if (prog?.semana_atual) {
        semanaAtual = Math.min(4, Math.max(1, Number(prog.semana_atual)));
      }
    }

    const dica = dicaParaDia(dia, semanaAtual);
    if (!dica) continue;

    const nome = (lead.nome || "").split(" ")[0] || "";
    const msg =
      `${nome ? `${nome}, ` : ""}dia ${dia} da sua Rotina 💙\n\n` +
      `${dica.texto}\n\n` +
      `Quando cumprir a missão de hoje, marca lá no app na aba *Hoje*.`;

    const wa = await sendWhatsApp(lead.telefone, msg);
    await supabaseAdmin.from("whatsapp_logs").insert({
      telefone: lead.telefone,
      mensagem: msg,
      status: wa.ok ? "enviado" : "falhou",
      erro: wa.error ?? null,
    });

    if (wa.ok) {
      enviados.add(dia);
      respostas.rotina_dicas = {
        inicio,
        dias_enviados: Array.from(enviados).sort((a, b) => a - b),
      };
      await supabaseAdmin
        .from("leads")
        .update({ respostas: respostas as never })
        .eq("id", lead.id);
      resultados.push({ lead: lead.id, dia, status: "enviado" });
    } else {
      resultados.push({ lead: lead.id, dia, status: "falhou" });
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

        // TODO: Protocolo de 7 Dias descontinuado, reativar só se decidirmos voltar com isso
        // const cadencia = await processarCadenciaProtocolo(
        //   supabaseAdmin as any,
        //   sendWhatsApp,
        // );
        const cadencia: Array<{ lead: string; dia?: number; status: string }> = [];
        const reengajados = await processarReengajamento(
          supabaseAdmin,
          sendWhatsApp,
        );
        const rotina = await processarCadenciaRotina(supabaseAdmin, sendWhatsApp);

        // suppress unused import warning
        void horasDesde;
        void processarCadenciaProtocolo;

        return Response.json({
          ok: true,
          cadencia,
          reengajados,
          rotina,
          ts: new Date().toISOString(),
        });
      },
      GET: async () =>
        Response.json({ service: "Zero Lipedema · Cron tick", ok: true }),
    },
  },
});
