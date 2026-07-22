import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Server functions da aba WhatsApp (Evolution) no painel admin. */

async function assertAdmin(supabase: {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }>;
}, userId: string) {
  const { data } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
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
