import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Fluxo de acesso ao app após o Mapa:
 * - criarAcessoMapa: cria conta no Auth, insere profile, envia login+senha por WhatsApp.
 * - getMyProfile: usada pelo /app para renderizar o guia personalizado.
 * - testarEvolution / salvarEvolutionConfig: administração da Evolution API.
 */

const SENHA_PADRAO = "zero123";

function emailFrom(telefone: string) {
  const digits = telefone.replace(/\D/g, "");
  return `wa${digits}@zerolipedema.app`;
}

// Senha aleatória, curta e fácil de digitar no celular.
// Ex: "zero7834". A lead só vê essa senha pelo WhatsApp.
function gerarSenha(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `zero${n}`;
}

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

    // Se o telefone chegou agora, atualiza o lead antes de prosseguir.
    if (data.telefone) {
      await supabaseAdmin
        .from("leads")
        .update({ telefone: data.telefone })
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

    if (!lead.telefone || lead.telefone === "pendente" || lead.telefone.replace(/\D/g, "").length < 8) {
      throw new Error("Telefone inválido — preciso do WhatsApp com DDD.");
    }

    const senha = gerarSenha();
    const email = emailFrom(lead.telefone);
    let userId = lead.user_id as string | null;
    let novaConta = false;

    if (!userId) {
      const { data: created, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: senha,
          email_confirm: true,
          user_metadata: {
            nome: lead.nome,
            telefone: lead.telefone,
          },
        });
      if (createErr || !created?.user) {
        // conta já pode existir — tenta atualizar por email
        const { data: list } = await supabaseAdmin.auth.admin.listUsers();
        const found = list?.users?.find((u) => u.email === email);
        if (!found) {
          throw new Error(
            `Falha ao criar acesso: ${createErr?.message ?? "usuário não localizado"}`,
          );
        }
        userId = found.id;
        await supabaseAdmin.auth.admin.updateUserById(userId, { password: senha });
      } else {
        userId = created.user.id;
        novaConta = true;
      }

      const diag = lead.diagnostico as { estagio?: string } | null;
      await supabaseAdmin.from("profiles").upsert(
        {
          id: userId,
          nome: lead.nome,
          telefone: lead.telefone,
          perfil: diag?.estagio ?? null,
          respostas: lead.respostas,
          diagnostico: lead.diagnostico,
          senha_temporaria: true,
        },
        { onConflict: "id" },
      );

      await supabaseAdmin
        .from("leads")
        .update({ user_id: userId, status: "acesso_criado" })
        .eq("id", lead.id);
    } else {
      await supabaseAdmin.auth.admin.updateUserById(userId, { password: senha });
      await supabaseAdmin
        .from("profiles")
        .update({ senha_temporaria: true })
        .eq("id", userId);
    }

    const primeiroNome = String(lead.nome).split(" ")[0];
    const baseUrl =
      process.env.APP_PUBLIC_URL ?? "https://quizzerolipedmea.lovable.app";
    const loginUrl = `${baseUrl}/auth`;

    const mensagem = `Oi ${primeiroNome}! Aqui é da equipe da Dra. Gabriela Rosado 💙

Seu *Mapa do Lipedema* está pronto e eu já preparei um acesso exclusivo pra você no app:

🔗 Link: ${loginUrl}
👤 Login: ${lead.telefone}
🔑 Senha: ${senha}

Ao entrar você encontra:
• Seu perfil personalizado
• As 3 prioridades da sua semana
• Guia completo com as dicas da Gabriela

Qualquer coisa, me chama aqui mesmo. ✨`;

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
      senha,
      email,
      loginUrl,
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
        "id, nome, telefone, perfil, respostas, diagnostico, senha_temporaria, created_at",
      )
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });
