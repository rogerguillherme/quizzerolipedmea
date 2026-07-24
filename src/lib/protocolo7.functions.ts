import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Inscreve a usuária na cadência de 7 dias do Protocolo.
 * - Marca `respostas.jornada_7dias` no lead correspondente (com `diasEnviados: [1]`).
 * - Envia a mensagem de boas-vindas + lista de compras pelo WhatsApp.
 * - Loga o envio em `whatsapp_logs` e marca `atencao` no lead se falhar.
 * A cadência dos dias 2–7 roda via cron em /api/public/hooks/cron-tick.
 */
export const iniciarProtocolo7 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        regiao: z.string(),
        restricao: z.string(),
        refeicao: z.string(),
        opcaoTitulo: z.string(),
        listaCompras: z.array(z.string()),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { sendWhatsApp } = await import("./evolution.server");

    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("id, nome, telefone, respostas")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lead) {
      return { ok: false as const, error: "Perfil não encontrado" };
    }

    const respostas = (lead.respostas as Record<string, unknown>) || {};
    respostas.jornada_7dias = {
      ativa: true,
      iniciado_em: new Date().toISOString(),
      regiao: data.regiao,
      restricao: data.restricao,
      refeicao: data.refeicao,
      opcao: data.opcaoTitulo,
      lista_compras: data.listaCompras,
      dia_atual: 1,
      dias_enviados: [1],
      feedback: {} as Record<string, string>,
    };

    await supabaseAdmin
      .from("leads")
      .update({ respostas: respostas as never, status: "protocolo_7d_ativo" })
      .eq("id", lead.id);

    const primeiroNome = (lead.nome || "").split(" ")[0] || "amiga";
    const msg =
      `Oi ${primeiroNome}! 💙 Seu Protocolo de 7 Dias começou.\n\n` +
      `Nos próximos 7 dias vou te enviar dicas curtinhas por aqui, ` +
      `com 2 receitas práticas em dois dias da semana.\n\n` +
      `📝 *Sua lista de compras:*\n` +
      data.listaCompras.map((i) => `• ${i}`).join("\n") +
      `\n\nAo final do dia eu te pergunto como foi — ` +
      `responde só se quiser, sem cobrança. — Dra. Gabriela`;

    const wa = await sendWhatsApp(lead.telefone, msg);

    await supabaseAdmin.from("whatsapp_logs").insert({
      telefone: lead.telefone,
      mensagem: msg,
      status: wa.ok ? "enviado" : "falhou",
      erro: wa.error ?? null,
    });

    if (!wa.ok) {
      // Marca o lead para aparecer na fila de atenção da Gabriela em /admin.
      respostas.atencao = {
        motivo: "envio_dia1_falhou",
        erro: wa.error ?? "desconhecido",
        criado_em: new Date().toISOString(),
      };
      await supabaseAdmin
        .from("leads")
        .update({ respostas: respostas as never })
        .eq("id", lead.id);
    }

    return { ok: true as const, whatsappEnviado: wa.ok, erro: wa.error ?? null };
  });

export const registrarFeedbackDia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        dia: z.number().int().min(1).max(7),
        resposta: z.enum(["sim", "parcial", "nao"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("id, respostas")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!lead) return { ok: false as const };
    const respostas = (lead.respostas as Record<string, unknown>) || {};
    const j = (respostas.jornada_7dias as Record<string, unknown>) || {};
    const feedback = (j.feedback as Record<string, string>) || {};
    feedback[String(data.dia)] = data.resposta;
    j.feedback = feedback;
    j.dia_atual = Math.max(Number(j.dia_atual || 1), data.dia + 1);
    j.ultimo_feedback_em = new Date().toISOString();
    respostas.jornada_7dias = j;
    await supabaseAdmin
      .from("leads")
      .update({ respostas: respostas as never })
      .eq("id", lead.id);
    return { ok: true as const };
  });
