import { descreverRegua } from "@/lib/cadencia-estado";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Fluxo de acesso ao app após o Mapa:
 * - criarAcessoMapa: cria conta no Auth, insere profile, envia login+senha por WhatsApp.
 * - getMyProfile: usada pelo /app para renderizar o guia personalizado.
 * - testarEvolution / salvarEvolutionConfig: administração da Evolution API.
 */

// ---------------- Criar acesso pós-quiz -----------------

export const criarAcessoMapa = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        // Telefone informado no final do chat (opcional; se vier, sobrescreve o do lead).
        telefone: z.string().trim().min(8).max(40).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { sendWhatsApp } = await import("./evolution.server");
    const { normalizePhoneBR } = await import("./phone");

    // Se o telefone chegou agora, normaliza e atualiza o lead antes de prosseguir.
    if (data.telefone) {
      const normalizado = normalizePhoneBR(data.telefone);
      if (!normalizado) {
        throw new Error("Telefone inválido — preciso do WhatsApp com DDD.");
      }
      await supabaseAdmin
        .from("leads")
        .update({ telefone: normalizado })
        .eq("id", data.leadId);
    }

    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("leads")
      .select("id, nome, telefone, respostas, diagnostico, user_id")
      .eq("id", data.leadId)
      .single();

    if (leadErr || !lead) {
      throw new Error(`Lead não encontrado: ${leadErr?.message ?? "n/a"}`);
    }

    const telefoneNorm = normalizePhoneBR(lead.telefone ?? "");
    if (!telefoneNorm) {
      throw new Error("Telefone inválido — preciso do WhatsApp com DDD.");
    }
    lead.telefone = telefoneNorm;

    // Cria (ou reutiliza) a conta no Auth + profile. Mesma lógica usada no
    // fluxo pós-compra, centralizada em account-access.server.
    const { ensureAcessoLead, gerarLoginUrl } = await import("./account-access.server");
    const { email, novaConta } = await ensureAcessoLead(
      {
        id: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        respostas: lead.respostas,
        diagnostico: lead.diagnostico,
        user_id: (lead.user_id as string | null) ?? null,
      },
      "acesso_criado",
    );

    const primeiroNome = String(lead.nome).split(" ")[0];

    // Link de entrada direta: gera um magic link e manda a lead pra /entrar,
    // que troca o token por sessão e leva pra tela onde ela escolhe a senha.
    // Se por algum motivo o link não puder ser gerado, cai no login tradicional.
    const loginUrl = await gerarLoginUrl(email, lead.telefone);

    const mensagem = `Oi ${primeiroNome}! Aqui é a Gabriela 💙

Seu *Mapa do Lipedema* está pronto e eu já preparei um acesso exclusivo pra você no app:

🔗 Toque aqui pra entrar: ${loginUrl}

O link já abre o app no seu nome, você só escolhe a sua senha e pronto.

Ao entrar você encontra:
• Seu perfil personalizado
• As 3 prioridades da sua semana
• Guia completo com as dicas da Gabriela

Qualquer coisa, me chama aqui mesmo. ✨

✨ *Teste grátis:* me manda até *3 fotos de refeições* suas nos próximos dias que eu te dou um feedback rápido de cada uma, sem compromisso.`;

    // Segundo token, exclusivo para entrar direto no navegador ao terminar o quiz.
    // Precisa ser um token diferente do enviado no WhatsApp: magic link é de uso único.
    let autoLoginToken: string | null = null;
    try {
      const { data: autoLink } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      autoLoginToken = autoLink?.properties?.hashed_token ?? null;
    } catch {
      autoLoginToken = null;
    }

    const wa = await sendWhatsApp(lead.telefone, mensagem);

    await supabaseAdmin.from("whatsapp_logs").insert({
      telefone: lead.telefone,
      mensagem,
      status: wa.ok ? "enviado" : "falhou",
      erro: wa.error ?? null,
    });

    return {
      ok: true,
      novaConta,
      login: lead.telefone,
      email,
      loginUrl,
      autoLoginToken,
      whatsappEnviado: wa.ok,
      whatsappErro: wa.error ?? null,
    };
  });

// ---------------- Perfil da usuária (usado pelo /app) -----------------

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select(
        "id, nome, telefone, perfil, respostas, diagnostico, senha_temporaria, created_at, mapa_popup_visto_em, mapa_popup_aberturas",
      )
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

// ---------------- Popup do Mapa do Lipedema -----------------
// `abertura` conta quantas vezes o sheet subiu (limite de 3 exibições
// automáticas); `visto` só é gravado quando ela chega ao passo final.

export const registrarMapaPopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ evento: z.enum(["abertura", "visto"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: atual, error: readErr } = await context.supabase
      .from("profiles")
      .select("mapa_popup_aberturas")
      .eq("id", context.userId)
      .maybeSingle();
    if (readErr) throw readErr;

    const patch =
      data.evento === "visto"
        ? { mapa_popup_visto_em: new Date().toISOString() }
        : { mapa_popup_aberturas: (atual?.mapa_popup_aberturas ?? 0) + 1 };

    const { error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true } as const;
  });


// ---------------- Fila de atenção (admin) -----------------
// Leads marcados com respostas.atencao (envio falhou / 3+ dias sem responder).
export const listarLeadsAtencao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Acesso restrito.");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data } = await supabaseAdmin
      .from("leads")
      .select("id, nome, telefone, status, respostas, updated_at")
      // Entram na fila: marcadas com atenção, pausadas por resposta ou em fast-track.
      .or(
        "respostas->atencao.not.is.null,respostas->>cadencia_pausada_em.not.is.null,respostas->>fast_track_em.not.is.null",
      )
      .order("updated_at", { ascending: false })
      .limit(50);

    return (data ?? []).map((l) => {
      const at = (l.respostas as Record<string, unknown>)?.atencao as
        | { motivo?: string; criado_em?: string; erro?: string }
        | undefined;
      const regua = descreverRegua(
        l.respostas as Record<string, unknown>,
        l.status,
      );
      return {
        id: l.id,
        nome: l.nome,
        telefone: l.telefone,
        status: l.status,
        motivo:
          at?.motivo ??
          (regua.pausada
            ? "respondeu_48h"
            : regua.fastTrack
              ? "fast_track"
              : "desconhecido"),
        criadoEm:
          at?.criado_em ?? regua.pausadaEm ?? regua.fastTrackEm ?? l.updated_at,

        // Estado da régua: em que passo está, se pausou por resposta, etc.
        regua: descreverRegua(
          l.respostas as Record<string, unknown>,
          l.status,
        ),
      };
    });
  });

