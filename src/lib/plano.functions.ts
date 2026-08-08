import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Captura do WhatsApp dentro do popup do Mapa na landing /plano.
 *
 * Este é o único ponto do funil novo que dispara o WhatsApp do Mapa — o envio
 * automático saiu do `submitMapa` justamente porque agora o número só é
 * confirmado aqui, depois que a lead vê a leitura dela na tela.
 *
 * O que a mensagem entrega é o ACESSO À PLATAFORMA para ler o Mapa completo.
 * Não é PDF, não é material novo, e não é o Plano de R$67 (passo separado).
 */
export const enviarAcessoMapa = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        telefone: z.string().trim().min(8).max(40),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { normalizePhoneBR } = await import("./phone");
    const telefone = normalizePhoneBR(data.telefone);
    if (!telefone) {
      // Mensagem já em linguagem humana: o popup mostra isso direto.
      return {
        ok: false as const,
        motivo: "telefone_invalido" as const,
        mensagem: "Esse número não parece completo. Confere o DDD e os 9 dígitos?",
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("leads")
      .select("id, nome, telefone, respostas, diagnostico, user_id")
      .eq("id", data.leadId)
      .maybeSingle();

    if (leadErr || !lead) {
      return {
        ok: false as const,
        motivo: "lead_nao_encontrado" as const,
        mensagem: "Perdi seu Mapa aqui do meu lado. Pode tentar de novo em instantes?",
      };
    }

    await supabaseAdmin.from("leads").update({ telefone }).eq("id", lead.id);

    try {
      const { ensureAcessoLead, gerarLoginUrl } = await import("./account-access.server");
      const { email } = await ensureAcessoLead(
        {
          id: lead.id,
          nome: lead.nome,
          telefone,
          respostas: lead.respostas,
          diagnostico: lead.diagnostico,
          user_id: (lead.user_id as string | null) ?? null,
        },
        "acesso_criado",
      );

      const loginUrl = await gerarLoginUrl(email, telefone);
      const primeiroNome = String(lead.nome ?? "").trim().split(/\s+/)[0] ?? "";
      const diag = (lead.diagnostico ?? {}) as {
        estagio?: string;
        aberturaValidadora?: string;
        descricaoEstagio?: string;
        prioridades?: string[];
      };
      const prioridades = (diag.prioridades ?? [])
        .slice(0, 3)
        .map((p, i) => `${i + 1}. ${p}`)
        .join("\n");

      const mensagem =
        `${primeiroNome ? `Oi ${primeiroNome}!` : "Oi!"} Aqui é a Gabriela 💙\n\n` +
        `${diag.aberturaValidadora ?? "Seu Mapa do Lipedema ficou pronto."}\n\n` +
        `*Seu Mapa do Lipedema*\n` +
        (diag.estagio ? `Estágio percebido: ${diag.estagio}\n` : "") +
        `${diag.descricaoEstagio ?? ""}\n\n` +
        (prioridades ? `*Suas 3 prioridades agora:*\n${prioridades}\n\n` : "") +
        `🔗 Seu Mapa completo está aqui: ${loginUrl}\n\n` +
        `O link já abre no seu nome, você só escolhe uma senha. ` +
        `Esse acesso é gratuito e não tem cobrança nenhuma nessa etapa — ` +
        `o Plano de 30 dias é um passo separado, só se você quiser depois.\n\n` +
        `Me conta uma coisa: o inchaço piora mais de manhã ou no fim do dia?`;

      const { sendWhatsApp } = await import("./evolution.server");
      const wa = await sendWhatsApp(telefone, mensagem);

      await supabaseAdmin.from("whatsapp_logs").insert({
        telefone,
        mensagem,
        status: wa.ok ? "enviado" : "falhou",
        erro: wa.error ?? null,
      });

      if (!wa.ok) {
        return {
          ok: false as const,
          motivo: "envio_falhou" as const,
          mensagem:
            "Não consegui abrir a conversa no WhatsApp agora. Seu acesso já está criado — quer tentar o envio de novo?",
          loginUrl,
        };
      }

      return { ok: true as const, loginUrl, telefone };
    } catch (e) {
      console.error("[enviarAcessoMapa]", e);
      return {
        ok: false as const,
        motivo: "erro" as const,
        mensagem: "Algo travou aqui do meu lado. Tenta de novo em alguns segundos?",
      };
    }
  });
