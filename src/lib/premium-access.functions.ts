import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PREMIUM_FEATURES } from "@/lib/premium-features";

/**
 * Mensagem de boas-vindas do acesso Premium (30 dias).
 * Enviada automaticamente após compra confirmada (Kiwify) e disponível
 * como ação manual no /admin/mapa ("Liberar Premium").
 *
 * A lista de entregáveis é derivada de `PREMIUM_FEATURES` para não duplicar
 * o conteúdo da oferta. Anamnese, exames e prescrição personalizada NÃO são
 * deste plano (pertencem ao plano de R$297) e não devem ser prometidos aqui.
 */
export function buildPremiumWelcomeMessage(nome: string, loginUrl: string) {
  const primeiro = String(nome ?? "").split(" ")[0] || "linda";
  const itens = PREMIUM_FEATURES.map((f) => `✅ ${f.titulo}`).join("\n");
  return `Oi ${primeiro}! Aqui é a Gabriela 💙

Seu *Plano Premium Zero Lipedema · 30 dias* foi liberado! 🎉

Nos próximos 30 dias você tem:
${itens}

🌱 Seu próximo passo: abra o app, toque em *Rotina* na barra de baixo e comece a missão da *Semana 1*, o café da manhã. Quando cumprir, é só tocar em "Cumpri a missão de hoje" na aba *Hoje*. Uma refeição de cada vez, no seu ritmo.

📸 Na aba *Registrar* você fotografa suas refeições e recebe a leitura na hora. E na aba *Progresso* você acompanha sua sequência de dias.

🔗 Seu app: ${loginUrl}

Qualquer coisa, me chama por aqui ✨`;
}


async function enviarPremiumParaLead(leadId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendWhatsApp } = await import("./evolution.server");
  const { normalizePhoneBR } = await import("./phone");
  const { ensureAcessoLead, gerarLoginUrl } = await import("./account-access.server");

  const { data: lead, error } = await supabaseAdmin
    .from("leads")
    .select("id, nome, telefone, status, respostas, diagnostico, user_id")
    .eq("id", leadId)
    .single();
  if (error || !lead) throw new Error(`Lead não encontrado: ${error?.message ?? ""}`);

  const telefone = normalizePhoneBR(lead.telefone ?? "");
  if (!telefone) throw new Error("Telefone inválido.");

  // No fluxo novo a compra pode acontecer antes de existir qualquer conta:
  // garantimos o usuário no Auth antes de mandar o link de acesso.
  const { email } = await ensureAcessoLead(
    {
      id: lead.id,
      nome: lead.nome,
      telefone,
      respostas: lead.respostas,
      diagnostico: lead.diagnostico,
      user_id: (lead.user_id as string | null) ?? null,
    },
    // A compra já está confirmada: a lead entra direto como cliente ativa.
    "plano_ativo",
  );

  const loginUrl = await gerarLoginUrl(email, telefone);
  const mensagem = buildPremiumWelcomeMessage(lead.nome, loginUrl);

  // Quem confirma o pagamento é a Kiwify, não a entrega da mensagem:
  // o status vira plano_ativo mesmo se o WhatsApp falhar.
  await supabaseAdmin
    .from("leads")
    .update({ status: "plano_ativo" })
    .eq("id", lead.id);

  const wa = await sendWhatsApp(telefone, mensagem);

  await supabaseAdmin.from("whatsapp_logs").insert({
    telefone,
    mensagem,
    status: wa.ok ? "enviado" : "falhou",
    erro: wa.error ?? null,
  });

  return { ok: wa.ok, erro: wa.error ?? null, loginUrl };
}

export { enviarPremiumParaLead };

export const enviarAcessoPremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ leadId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Acesso restrito.");

    return enviarPremiumParaLead(data.leadId);
  });
