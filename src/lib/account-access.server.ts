/**
 * Criação/reuso da conta de acesso da lead no Supabase Auth.
 *
 * Lógica compartilhada entre:
 *  - `criarAcessoMapa` (src/lib/mapa-access.functions.ts) — fluxo pós-quiz;
 *  - `enviarPremiumParaLead` (src/lib/premium-access.functions.ts) — pós-compra.
 *
 * No fluxo novo a lead pode comprar sem nunca ter criado conta, então quem
 * entrega o acesso precisa garantir que o usuário exista antes de mandar o link.
 */

export type LeadAcesso = {
  id: string;
  nome: string;
  telefone: string;
  respostas: unknown;
  diagnostico: unknown;
  user_id: string | null;
};

/** E-mail interno derivado do WhatsApp. A lead nunca digita esse endereço. */
export function emailFrom(telefone: string): string {
  const digits = telefone.replace(/\D/g, "");
  return `wa${digits}@zerolipedema.app`;
}

/**
 * Senha interna, usada só pra criar a conta no Auth. A lead nunca vê esse valor:
 * ela entra pelo link direto (magic link) e escolhe a própria senha em /definir-senha.
 */
export function gerarSenha(): string {
  return `zl-${crypto.randomUUID()}`;
}

export function appBaseUrl(): string {
  return process.env.APP_PUBLIC_URL ?? "https://quizzerolipedmea.lovable.app";
}

/**
 * Gera o link de entrada direta (magic link → /entrar). Se a geração falhar,
 * devolve o fallback do login tradicional com o telefone pré-preenchido.
 */
export async function gerarLoginUrl(email: string, telefone: string): Promise<string> {
  const baseUrl = appBaseUrl();
  const fallback = `${baseUrl}/auth?tel=${encodeURIComponent(telefone)}`;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = data?.properties?.hashed_token;
    if (error || !tokenHash) return fallback;
    return `${baseUrl}/entrar?t=${encodeURIComponent(tokenHash)}`;
  } catch {
    return fallback;
  }
}

export type EnsureAcessoResult = {
  lead: LeadAcesso;
  userId: string;
  email: string;
  novaConta: boolean;
};

/**
 * Garante que a lead tenha usuário no Auth + profile preenchido.
 * Reutiliza a conta quando ela já existe (por `lead.user_id` ou pelo e-mail interno).
 *
 * @param statusAoCriar status gravado na lead quando a conta é criada agora
 *                      (ex.: "acesso_criado"). Passe `null` para não alterar.
 */
export async function ensureAcessoLead(
  lead: LeadAcesso,
  statusAoCriar: string | null = "acesso_criado",
): Promise<EnsureAcessoResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const senha = gerarSenha();
  const email = emailFrom(lead.telefone);
  let userId = lead.user_id;
  let novaConta = false;

  if (!userId) {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome: lead.nome, telefone: lead.telefone },
    });

    if (createErr || !created?.user) {
      // A conta pode já existir (compra repetida, telefone reaproveitado): reusa.
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
        respostas: (lead.respostas ?? {}) as never,
        diagnostico: lead.diagnostico as never,
        senha_temporaria: true,
      },
      { onConflict: "id" },
    );

    await supabaseAdmin
      .from("leads")
      .update(statusAoCriar ? { user_id: userId, status: statusAoCriar } : { user_id: userId })
      .eq("id", lead.id);
  } else {
    await supabaseAdmin.auth.admin.updateUserById(userId, { password: senha });
    await supabaseAdmin
      .from("profiles")
      .update({ senha_temporaria: true })
      .eq("id", userId);
  }

  return { lead, userId, email, novaConta };
}
