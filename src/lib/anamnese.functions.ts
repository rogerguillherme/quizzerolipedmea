import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Onboarding do plano Premium:
 * 1) Paciente compra (webhook Kiwify muda leads.status para "plano_ativo")
 * 2) Preenche anamnese completa (salvo em leads.respostas.anamnese_premium)
 * 3) Envia pelo menos 1 exame (contamos exames_leituras)
 * Só depois liberamos o restante do app premium.
 */

const BLOCOS = [
  "identificacao",
  "queixa",
  "historico",
  "ginecologico",
  "medicamentos",
  "familiar",
  "alimentar",
  "intestinal",
  "sono_estresse",
  "atividade",
  "objetivo",
] as const;

export type AnamneseBloco = (typeof BLOCOS)[number];

// Payload flexível (o form pode evoluir sem migrar schema)
const AnamneseSchema = z
  .object({
    identificacao: z
      .object({
        idade: z.string().max(4).optional(),
        peso: z.string().max(6).optional(),
        altura: z.string().max(6).optional(),
        cidade: z.string().max(80).optional(),
      })
      .partial()
      .optional(),
    queixa: z
      .object({
        principal: z.string().max(500).optional(),
        tempo: z.string().max(60).optional(),
        piora: z.string().max(300).optional(),
        alivio: z.string().max(300).optional(),
      })
      .partial()
      .optional(),
    historico: z
      .object({
        diagnosticoMedico: z.string().max(200).optional(),
        estagio: z.string().max(60).optional(),
        tratamentosJaFeitos: z.string().max(500).optional(),
        cirurgias: z.string().max(300).optional(),
      })
      .partial()
      .optional(),
    ginecologico: z
      .object({
        ciclo: z.string().max(120).optional(),
        anticoncepcional: z.string().max(200).optional(),
        gestacoes: z.string().max(60).optional(),
        menopausa: z.string().max(40).optional(),
      })
      .partial()
      .optional(),
    medicamentos: z
      .object({
        usoContinuo: z.string().max(500).optional(),
        suplementos: z.string().max(500).optional(),
        alergias: z.string().max(300).optional(),
      })
      .partial()
      .optional(),
    familiar: z
      .object({
        lipedema: z.string().max(120).optional(),
        obesidade: z.string().max(120).optional(),
        varizes: z.string().max(120).optional(),
        tireoide: z.string().max(120).optional(),
      })
      .partial()
      .optional(),
    alimentar: z
      .object({
        cafe: z.string().max(300).optional(),
        almoco: z.string().max(300).optional(),
        lanche: z.string().max(300).optional(),
        jantar: z.string().max(300).optional(),
        agua: z.string().max(40).optional(),
        alcool: z.string().max(120).optional(),
        acucar: z.string().max(120).optional(),
        ultraprocessados: z.string().max(200).optional(),
      })
      .partial()
      .optional(),
    intestinal: z
      .object({
        frequencia: z.string().max(60).optional(),
        forma: z.string().max(60).optional(),
        inchaco: z.string().max(200).optional(),
      })
      .partial()
      .optional(),
    sono_estresse: z
      .object({
        horas: z.string().max(20).optional(),
        qualidade: z.string().max(60).optional(),
        estresse: z.string().max(200).optional(),
      })
      .partial()
      .optional(),
    atividade: z
      .object({
        pratica: z.string().max(120).optional(),
        frequencia: z.string().max(60).optional(),
        limitacoes: z.string().max(200).optional(),
      })
      .partial()
      .optional(),
    objetivo: z
      .object({
        principal: z.string().max(400).optional(),
        prazo: z.string().max(60).optional(),
        expectativa: z.string().max(400).optional(),
      })
      .partial()
      .optional(),
  })
  .partial();

export type AnamnesePayload = z.infer<typeof AnamneseSchema>;

async function findLeadIdForUser(userId: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("leads")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

// -------- Status --------
export const getPremiumOnboarding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("id, status, respostas")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const respostas = (lead?.respostas ?? {}) as Record<string, unknown>;
    const anamnese = (respostas.anamnese_premium ?? null) as
      | (AnamnesePayload & { completed_at?: string })
      | null;

    // Conta exames enviados
    const { count } = await supabaseAdmin
      .from("exames_leituras")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", context.userId);

    const status = lead?.status ?? null;
    const isPremium = status === "plano_ativo";
    const anamneseCompleta = !!anamnese?.completed_at;
    const exameEnviado = (count ?? 0) > 0;

    return {
      leadId: lead?.id ?? null,
      status,
      isPremium,
      anamneseCompleta,
      exameEnviado,
      exameCount: count ?? 0,
      anamnese: (anamnese ?? {}) as AnamnesePayload & {
        completed_at?: string;
        updated_at?: string;
        last_step?: number;
      },
      lastStep: (anamnese as { last_step?: number } | null)?.last_step ?? 0,
      updatedAt: (anamnese as { updated_at?: string } | null)?.updated_at ?? null,
    };
  });

// -------- Salvar rascunho / concluir --------
export const salvarAnamnese = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        payload: AnamneseSchema,
        concluir: z.boolean().optional(),
        lastStep: z.number().int().min(0).max(50).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const leadId = await findLeadIdForUser(context.userId);
    if (!leadId) throw new Error("Perfil não encontrado.");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("respostas")
      .eq("id", leadId)
      .maybeSingle();
    const respostas = (lead?.respostas ?? {}) as Record<string, unknown>;

    const anamneseAtual = (respostas.anamnese_premium ?? {}) as Record<
      string,
      unknown
    >;

    const novoAnamnese = {
      ...anamneseAtual,
      ...data.payload,
      updated_at: new Date().toISOString(),
      ...(typeof data.lastStep === "number" ? { last_step: data.lastStep } : {}),
      ...(data.concluir ? { completed_at: new Date().toISOString() } : {}),
    };

    const { error } = await supabaseAdmin
      .from("leads")
      .update({
        respostas: { ...respostas, anamnese_premium: novoAnamnese },
      })
      .eq("id", leadId);
    if (error) throw error;

    return { ok: true, concluida: !!data.concluir };
  });
