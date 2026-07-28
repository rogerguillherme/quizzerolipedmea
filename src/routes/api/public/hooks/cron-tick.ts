// Cron hourly: cadência do Protocolo (dias 2-7) + reengajamento leve + fila de atenção.
// Chamado por pg_cron via pg_net (ver migração scheduled_cron_tick).
// Endpoint público — validamos com apikey (anon key do Supabase).
import { createFileRoute } from "@tanstack/react-router";
import {
  DICAS_7_DIAS,
  RECEITAS_PRATICAS,
  ESCALONAMENTO_DIAS_SEM_RESPOSTA,
} from "@/lib/protocolo7";

const MS_HORA = 60 * 60 * 1000;
const MS_DIA = 24 * MS_HORA;

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

async function processarReengajamento(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  sendWhatsApp: (t: string, m: string) => Promise<{ ok: boolean; error?: string }>,
) {
  const enviados: string[] = [];

  // 0) Mapa iniciado há 1h+ com telefone válido, ainda sem acesso criado (user_id nulo).
  //    Lembrete rápido pra quem viu o relatório mas não pediu o acesso pelo WhatsApp.
  const { data: pos1h } = await supabaseAdmin
    .from("leads")
    .select("id, nome, telefone, respostas, created_at, user_id")
    .eq("status", "mapa_gerado")
    .is("user_id", null)
    .neq("telefone", "pendente")
    .lt("created_at", new Date(Date.now() - 1 * MS_HORA).toISOString())
    .gt("created_at", new Date(Date.now() - 24 * MS_HORA).toISOString())
    .limit(200);

  for (const lead of pos1h ?? []) {
    const respostas = (lead.respostas ?? {}) as LeadResp;
    const reengaje = respostas.reengaje ?? {};
    if (reengaje.pos1h_at) continue;
    // Só envia se o telefone parece válido (>=10 dígitos).
    const digits = String(lead.telefone ?? "").replace(/\D/g, "");
    if (digits.length < 10) continue;
    const nome = (lead.nome || "").split(" ")[0] || "amiga";
    const msg =
      `Oi ${nome} 💙 Aqui é a Gabriela 💙\n\n` +
      `Vi que você começou seu *Mapa do Lipedema* e parou antes de receber o acesso ao app. ` +
      `Não some — em 1 minutinho a gente termina e você já sai com suas 3 prioridades da semana.\n\n` +
      `Quer que eu te reenvie o link do Mapa agora?`;
    const wa = await sendWhatsApp(lead.telefone, msg);
    await supabaseAdmin.from("whatsapp_logs").insert({
      telefone: lead.telefone,
      mensagem: msg,
      status: wa.ok ? "enviado" : "falhou",
      erro: wa.error ?? null,
    });
    reengaje.pos1h_at = new Date().toISOString();
    respostas.reengaje = reengaje;
    await supabaseAdmin
      .from("leads")
      .update({ respostas: respostas as never })
      .eq("id", lead.id);
    if (wa.ok) enviados.push(lead.id);
  }

  // 1) Mapa gerado há 24h+ com telefone válido, ainda sem acesso criado.
  const { data: pos24 } = await supabaseAdmin
    .from("leads")
    .select("id, nome, telefone, respostas, created_at")
    .eq("status", "mapa_gerado")
    .neq("telefone", "pendente")
    .lt("created_at", new Date(Date.now() - 24 * MS_HORA).toISOString())
    .limit(200);

  for (const lead of pos24 ?? []) {
    const respostas = (lead.respostas ?? {}) as LeadResp;
    const reengaje = respostas.reengaje ?? {};
    if (reengaje.pos24h_at) continue;
    const nome = (lead.nome || "").split(" ")[0] || "amiga";
    const msg =
      `Oi ${nome}! 💙 Aqui é da equipe da Dra. Gabriela.\n\n` +
      `Vi que você começou seu Mapa do Lipedema, mas ainda não entrou no app. ` +
      `Deixei tudo pronto pra você — quer que eu te reenvie o acesso?`;
    const wa = await sendWhatsApp(lead.telefone, msg);
    await supabaseAdmin.from("whatsapp_logs").insert({
      telefone: lead.telefone,
      mensagem: msg,
      status: wa.ok ? "enviado" : "falhou",
      erro: wa.error ?? null,
    });
    reengaje.pos24h_at = new Date().toISOString();
    respostas.reengaje = reengaje;
    await supabaseAdmin
      .from("leads")
      .update({ respostas: respostas as never })
      .eq("id", lead.id);
    if (wa.ok) enviados.push(lead.id);
  }

  // 2) Acesso criado há 48h+ e ainda não iniciou o Protocolo.
  const { data: pos48 } = await supabaseAdmin
    .from("leads")
    .select("id, nome, telefone, respostas, updated_at")
    .eq("status", "acesso_criado")
    .lt("updated_at", new Date(Date.now() - 48 * MS_HORA).toISOString())
    .limit(200);

  for (const lead of pos48 ?? []) {
    const respostas = (lead.respostas ?? {}) as LeadResp;
    const reengaje = respostas.reengaje ?? {};
    if (reengaje.pos48h_at) continue;
    const nome = (lead.nome || "").split(" ")[0] || "amiga";
    const msg =
      `${nome}, é a Gabriela 💙 Passei aqui só pra te lembrar:\n\n` +
      `Se quiser continuar com registro de refeições ilimitado, dicas diárias, cardápios, chás e suplementos personalizados, o Plano Premium tá te esperando no app, na aba Premium. R$67 o mês.\n\n` +
      `Sem pressa, fico à disposição se tiver dúvida.`;
    const wa = await sendWhatsApp(lead.telefone, msg);
    await supabaseAdmin.from("whatsapp_logs").insert({
      telefone: lead.telefone,
      mensagem: msg,
      status: wa.ok ? "enviado" : "falhou",
      erro: wa.error ?? null,
    });
    reengaje.pos48h_at = new Date().toISOString();
    respostas.reengaje = reengaje;
    await supabaseAdmin
      .from("leads")
      .update({ respostas: respostas as never })
      .eq("id", lead.id);
    if (wa.ok) enviados.push(lead.id);
  }

  return enviados;
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

        const cadencia = await processarCadenciaProtocolo(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          supabaseAdmin as any,
          sendWhatsApp,
        );
        const reengajados = await processarReengajamento(
          supabaseAdmin,
          sendWhatsApp,
        );

        // suppress unused import warning
        void horasDesde;

        return Response.json({
          ok: true,
          cadencia,
          reengajados,
          ts: new Date().toISOString(),
        });
      },
      GET: async () =>
        Response.json({ service: "Zero Lipedema · Cron tick", ok: true }),
    },
  },
});
