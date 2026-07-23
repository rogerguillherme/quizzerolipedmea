import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Inscreve o usuário na cadência de 7 dias do Protocolo.
 * - Marca `respostas.jornada_7dias` no lead correspondente.
 * - Dispara a mensagem de boas-vindas + lista de compras pelo WhatsApp.
 * A cadência diária propriamente é agendada por um job/cron externo (não neste turno),
 * aproveitando a marca em `leads.respostas.jornada_7dias`.
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

    // Encontra o lead vinculado ao user_id logado.
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
      dia_atual: 1,
    };

    await supabaseAdmin
      .from("leads")
      .update({ respostas: respostas as never, status: "protocolo_7d_ativo" })
      .eq("id", lead.id);

    // Mensagem inicial
    const primeiroNome = (lead.nome || "").split(" ")[0] || "amiga";
    const msg =
      `Oi ${primeiroNome}! 💙 Seu Protocolo de 7 Dias começou.\n\n` +
      `Nos próximos 7 dias vou te enviar dicas curtinhas por aqui, ` +
      `com 2 receitas práticas em dois dias da semana.\n\n` +
      `📝 *Sua lista de compras:*\n` +
      data.listaCompras.map((i) => `• ${i}`).join("\n") +
      `\n\nDica de hoje: ao final do dia eu te pergunto como foi — ` +
      `responde só se quiser, sem cobrança. — Dra. Gabriela`;

    await sendWhatsApp(lead.telefone, msg);

    return { ok: true as const };
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
    const feedback =
      (j.feedback as Record<string, string>) || {};
    feedback[String(data.dia)] = data.resposta;
    j.feedback = feedback;
    j.dia_atual = Math.max(Number(j.dia_atual || 1), data.dia + 1);
    respostas.jornada_7dias = j;
    await supabaseAdmin.from("leads").update({ respostas: respostas as never }).eq("id", lead.id);
    return { ok: true as const };
  });
