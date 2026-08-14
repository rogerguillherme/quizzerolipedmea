import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Acesso restrito.");
}

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("crm_conversations")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: conv } = await context.supabase
      .from("crm_conversations")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    const { data: msgs } = await context.supabase
      .from("crm_messages")
      .select("*")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true });

    // Gera links temporários para as mídias (áudio/imagem) recebidas.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lista = ((msgs ?? []) as any[]).slice();
    const comMidia = lista.filter((m) => m.midia_path);
    if (comMidia.length > 0) {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data: signed } = await supabaseAdmin.storage
        .from("crm-midia")
        .createSignedUrls(
          comMidia.map((m) => m.midia_path as string),
          60 * 60,
        );
      const mapa = new Map<string, string>();
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl) mapa.set(s.path, s.signedUrl);
      }
      for (const m of comMidia) m.midia_url = mapa.get(m.midia_path) ?? null;
    }

    // marca como lida
    await context.supabase
      .from("crm_conversations")
      .update({ nao_lidas: 0 })
      .eq("id", data.id);
    return { conversation: conv, messages: lista };
  });


export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        conteudo: z.string().trim().min(1).max(4000),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { data: conv } = await context.supabase
      .from("crm_conversations")
      .select("telefone")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (!conv) throw new Error("Conversa não encontrada.");

    const { sendWhatsApp } = await import("./evolution.server");
    const result = await sendWhatsApp(conv.telefone, data.conteudo);

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    await supabaseAdmin.from("crm_messages").insert({
      conversation_id: data.conversationId,
      direcao: "out",
      autor: "humano",
      conteudo: data.conteudo,
      status: result.ok ? "enviado" : "falhou",
      erro: result.ok ? null : (result.error ?? null),
    });
    await supabaseAdmin
      .from("crm_conversations")
      .update({
        ultima_mensagem: data.conteudo,
        ultima_mensagem_em: new Date().toISOString(),
        modo: "humano",
      })
      .eq("id", data.conversationId);
    await supabaseAdmin.from("whatsapp_logs").insert({
      telefone: conv.telefone,
      mensagem: data.conteudo,
      status: result.ok ? "enviado" : "falhou",
      erro: result.ok ? null : (result.error ?? null),
    });
    return { ok: result.ok, error: result.error };
  });

export const setConversationMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        modo: z.enum(["ia", "humano"]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("crm_conversations")
      .update({ modo: data.modo })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const setConversationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["ativo", "aguardando", "resolvido", "escalado"]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("crm_conversations")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listTags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("crm_tags")
      .select("*")
      .order("nome");
    return data ?? [];
  });

export const createTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        nome: z.string().trim().min(1).max(40),
        cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("crm_tags")
      .insert({ nome: data.nome, cor: data.cor });
    if (error) throw error;
    return { ok: true };
  });

export const setConversationTags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        tags: z.array(z.string().uuid()),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("crm_conversations")
      .update({ tags: data.tags })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// CRM profissional: lista enriquecida (lead vinculado + etapa) e Kanban.
// ---------------------------------------------------------------------------

export const listConversationsRich = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { montarConversas } = await import("./crm.server");
    return montarConversas(context.supabase);
  });

export const setConversationEtapa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        etapa: z.enum([
          "mapa_feito",
          "em_conversa",
          "quer_saber_mais",
          "cliente",
          "sem_resposta",
        ]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("crm_conversations")
      .update({ etapa: data.etapa, etapa_manual: true })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const searchLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ termo: z.string().trim().min(2).max(80) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const termo = data.termo.replace(/[%,]/g, "");
    const { data: rows } = await context.supabase
      .from("leads")
      .select("id, nome, telefone, status, created_at")
      .or(`nome.ilike.%${termo}%,telefone.ilike.%${termo}%`)
      .order("created_at", { ascending: false })
      .limit(20);
    return rows ?? [];
  });

export const linkConversationLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        leadId: z.string().uuid().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("crm_conversations")
      .update({ lead_id: data.leadId })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
