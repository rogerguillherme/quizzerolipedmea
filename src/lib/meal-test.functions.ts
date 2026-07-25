import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Teste grátis de 3 fotos de refeição — canal APP (upload direto).
 * Compartilha o contador `leads.respostas.teste_fotos` com o canal WhatsApp.
 */

const STATUS_PAGO = new Set(["plano_ativo", "premium", "cliente"]);

export const getMealTestStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("telefone, nome")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile?.telefone) {
      return { usadas: 0, restantes: 3, pago: false, semLead: true };
    }
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("id, status, respostas")
      .eq("telefone", profile.telefone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!lead) return { usadas: 0, restantes: 3, pago: false, semLead: true };
    const respostas = (lead.respostas as Record<string, unknown>) ?? {};
    const teste = (respostas.teste_fotos as { usadas?: number }) ?? {};
    const usadas = Math.min(3, Number(teste.usadas ?? 0));
    return {
      usadas,
      restantes: Math.max(0, 3 - usadas),
      pago: STATUS_PAGO.has(String(lead.status)),
      semLead: false,
    };
  });

export const analisarFotoApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        base64: z.string().min(50),
        mimetype: z.string().default("image/jpeg"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { analisarFotoRefeicao } = await import("./meal-photo.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("telefone, nome")
      .eq("id", context.userId)
      .maybeSingle();

    if (!profile?.telefone) {
      throw new Error("Perfil sem telefone — refaça o Mapa para liberar o teste.");
    }

    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("id, status, respostas, nome")
      .eq("telefone", profile.telefone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lead) {
      throw new Error("Não encontrei seu cadastro no Mapa.");
    }

    const pago = STATUS_PAGO.has(String(lead.status));
    const respostas = (lead.respostas as Record<string, unknown>) ?? {};
    const teste = (respostas.teste_fotos as { usadas?: number }) ?? {};
    const usadas = Math.min(3, Number(teste.usadas ?? 0));

    if (!pago && usadas >= 3) {
      await supabaseAdmin.from("whatsapp_logs").insert({
        telefone: profile.telefone,
        mensagem: "[app-foto] tentativa após esgotar teste",
        status: "bloqueado",
        erro: null,
      });
      return {
        ok: false,
        esgotado: true,
        usadas,
        restantes: 0,
        feedback: null,
      };
    }

    const analise = await analisarFotoRefeicao(data.base64, data.mimetype);

    if (!analise.ok || !analise.feedback) {
      await supabaseAdmin.from("whatsapp_logs").insert({
        telefone: profile.telefone,
        mensagem: "[app-foto] falha na análise",
        status: "falhou",
        erro: analise.error ?? "erro desconhecido",
      });
      return {
        ok: false,
        esgotado: false,
        usadas,
        restantes: Math.max(0, 3 - usadas),
        feedback: null,
        erro: analise.error ?? "Não consegui analisar essa foto agora.",
      };
    }

    const contaComoUsada = !pago && analise.feedback.isRefeicao;
    const novasUsadas = contaComoUsada ? usadas + 1 : usadas;

    if (contaComoUsada) {
      respostas.teste_fotos = {
        usadas: novasUsadas,
        ultima_em: new Date().toISOString(),
      };
      await supabaseAdmin
        .from("leads")
        .update({ respostas: respostas as never })
        .eq("id", lead.id);
    }

    await supabaseAdmin.from("whatsapp_logs").insert({
      telefone: profile.telefone,
      mensagem: `[app-foto] ${analise.feedback.isRefeicao ? "refeição" : "não-refeição"} · ${analise.feedback.sugestao.slice(0, 100)}`,
      status: "analisado",
      erro: null,
    });

    return {
      ok: true,
      esgotado: false,
      usadas: novasUsadas,
      restantes: pago ? 3 : Math.max(0, 3 - novasUsadas),
      pago,
      feedback: analise.feedback,
    };
  });
