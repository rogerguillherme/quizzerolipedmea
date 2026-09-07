import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/settings.functions";

/**
 * Envia o Mapa do Lipedema (HTML já com as variáveis resolvidas pelo admin)
 * como PDF anexado no WhatsApp do lead.
 */
export const enviarMapaPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        html: z.string().min(1).max(500_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .select("id, nome, telefone")
      .eq("id", data.leadId)
      .single();
    if (error || !lead) throw new Error(`Lead não encontrado: ${error?.message ?? ""}`);

    const { normalizePhoneBR } = await import("@/lib/phone");
    const telefone = normalizePhoneBR(lead.telefone ?? "");
    if (!telefone) throw new Error("Telefone inválido.");

    const { renderHtmlToPdf } = await import("@/lib/pdf-render.server");
    const pdfBase64 = await renderHtmlToPdf(data.html);

    const { sendWhatsAppDocument } = await import("@/lib/evolution.server");
    const primeiroNome = lead.nome.trim().split(/\s+/)[0] || "mapa";
    const wa = await sendWhatsAppDocument(
      telefone,
      pdfBase64,
      `Mapa-do-Lipedema-${primeiroNome}.pdf`,
      "Seu Mapa do Lipedema 💙",
    );

    await supabaseAdmin.from("whatsapp_logs").insert({
      telefone,
      mensagem: "[PDF] Mapa do Lipedema",
      status: wa.ok ? "enviado" : "falhou",
      erro: wa.error ?? null,
    });

    return { ok: wa.ok, erro: wa.error ?? null };
  });
