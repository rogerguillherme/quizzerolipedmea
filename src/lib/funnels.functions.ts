import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!data) throw new Error("Acesso restrito.");
}

const StepSchema = z.object({
  id: z.string(),
  tipo: z.enum(["mensagem", "espera", "gatilho_ia", "condicao", "tag"]),
  // mensagem
  texto: z.string().optional(),
  // espera
  espera_min: z.number().int().min(0).max(60 * 24 * 30).optional(),
  // gatilho_ia
  ia_prompt: z.string().optional(),
  // condicao
  condicao_campo: z.string().optional(),
  condicao_valor: z.string().optional(),
  // tag
  tag_id: z.string().optional(),
});

const FunnelSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(1).max(120),
  descricao: z.string().max(500).optional().default(""),
  app_key: z.enum(["mapa", "protocolo", "derma"]),
  gatilho_tipo: z.enum(["manual", "mapa_completo", "tag", "dia_desafio"]),
  gatilho_valor: z.string().optional().default(""),
  ativo: z.boolean(),
  steps: z.array(StepSchema),
});

export const listFunnels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("crm_funnels")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const saveFunnel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => FunnelSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const payload = {
      nome: data.nome,
      descricao: data.descricao ?? "",
      app_key: data.app_key,
      gatilho_tipo: data.gatilho_tipo,
      gatilho_valor: data.gatilho_valor ?? "",
      ativo: data.ativo,
      steps: data.steps,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("crm_funnels")
        .update(payload)
        .eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: created, error } = await context.supabase
      .from("crm_funnels")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: created.id };
  });

export const deleteFunnel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("crm_funnels")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
