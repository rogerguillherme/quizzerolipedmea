import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Server functions da aba WhatsApp (Evolution) no painel admin. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error("[assertAdmin] erro consultando user_roles:", error);
    throw new Error("Não consegui validar seu acesso agora.");
  }
  if (!data) throw new Error("Acesso restrito à Gabriela.");
}

export const getEvolutionConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: row } = await supabaseAdmin
      .from("evolution_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    const { checkEvolutionStatus } = await import("./evolution.server");
    const status = await checkEvolutionStatus();

    const hasUrl = Boolean(process.env.EVOLUTION_API_URL);
    const hasKey = Boolean(process.env.EVOLUTION_API_KEY);
    const hasInstance = Boolean(process.env.EVOLUTION_INSTANCE);

    return {
      baseUrl: row?.base_url ?? "",
      instanceName: row?.instance_name ?? "",
      hasUrl,
      hasKey,
      hasInstance,
      status,
    };
  });

export const salvarEvolutionConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        baseUrl: z.string().trim().max(200).optional().default(""),
        instanceName: z.string().trim().max(80).optional().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("evolution_config")
      .update({
        base_url: data.baseUrl,
        instance_name: data.instanceName,
      })
      .eq("id", 1);
    if (error) throw error;
    return { ok: true };
  });

export const testarEvolution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { checkEvolutionStatus } = await import("./evolution.server");
    return await checkEvolutionStatus();
  });

export const getWhatsAppLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("whatsapp_logs")
      .select("id, telefone, mensagem, status, erro, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return data ?? [];
  });

/** Lê a config de webhook direto na Evolution + contagem real de entradas. */
export const getEvolutionWebhook = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { findEvolutionWebhook } = await import("./evolution.server");
    const remoto = await findEvolutionWebhook();

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const agora = Date.now();
    const h24 = new Date(agora - 24 * 60 * 60 * 1000).toISOString();
    const d7 = new Date(agora - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [r24, r7, total] = await Promise.all([
      supabaseAdmin
        .from("crm_messages")
        .select("id", { count: "exact", head: true })
        .eq("direcao", "in")
        .gte("created_at", h24),
      supabaseAdmin
        .from("crm_messages")
        .select("id", { count: "exact", head: true })
        .eq("direcao", "in")
        .gte("created_at", d7),
      supabaseAdmin
        .from("crm_messages")
        .select("id", { count: "exact", head: true })
        .eq("direcao", "in"),
    ]);

    const { data: hit } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("app_key", "mapa")
      .eq("setting_key", "evolution_webhook_ultimo_hit")
      .maybeSingle();

    return {
      remoto,
      entradas: {
        h24: r24.count ?? 0,
        d7: r7.count ?? 0,
        total: total.count ?? 0,
      },
      ultimoHit: (hit?.value as Record<string, unknown> | null) ?? null,
    };
  });

/** Configura o webhook na instância. Tenta v2 (aninhado) e cai para v1. */
export const setEvolutionWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ url: z.string().trim().url().max(300) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { setEvolutionWebhookRemote, findEvolutionWebhook } = await import(
      "./evolution.server"
    );
    const result = await setEvolutionWebhookRemote(data.url);
    const depois = await findEvolutionWebhook();
    return { result, depois };
  });
