// Server functions da Rotina Zero Lipedema (conteúdo do plano de R$67).
//
// Regras:
// - Toda leitura/escrita é escopada pela usuária autenticada (RLS via context.supabase).
// - O status premium vem da tabela `leads`, que só admin lê via Data API,
//   então é consultado com o cliente admin dentro do handler.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MIN_DIAS_AVANCAR } from "@/lib/rotina-content";

/** Data local (America/Sao_Paulo) no formato YYYY-MM-DD. */
function hojeISO(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function diasEntre(aISO: string, bISO: string): number {
  const a = Date.parse(`${aISO}T00:00:00Z`);
  const b = Date.parse(`${bISO}T00:00:00Z`);
  return Math.round((a - b) / 86_400_000);
}

/** Sequência de dias consecutivos terminando hoje ou ontem. */
function calcularSequencia(datas: readonly string[], hoje: string): number {
  const unicas = Array.from(new Set(datas)).sort().reverse();
  if (unicas.length === 0) return 0;
  const primeiroGap = diasEntre(hoje, unicas[0]!);
  if (primeiroGap > 1) return 0;
  let seq = 1;
  for (let i = 1; i < unicas.length; i++) {
    if (diasEntre(unicas[i - 1]!, unicas[i]!) === 1) seq++;
    else break;
  }
  return seq;
}

async function ehPremium(userId: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("leads")
    .select("status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.status === "plano_ativo";
}

type Ctx = { userId: string; supabase: any };

async function carregarEstado(context: Ctx) {
  const { supabase, userId } = context;
  const hoje = hojeISO();

  let { data: progresso } = await supabase
    .from("rotina_progresso")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!progresso) {
    const { data: criado, error } = await supabase
      .from("rotina_progresso")
      .insert({ user_id: userId })
      .select("*")
      .single();
    // Corrida entre duas abas: relê em vez de falhar.
    if (error) {
      const { data: relido } = await supabase
        .from("rotina_progresso")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      progresso = relido;
    } else {
      progresso = criado;
    }
  }

  const semanaAtual = Number(progresso?.semana_atual ?? 1);

  const { data: checkins } = await supabase
    .from("rotina_checkins")
    .select("id, semana, data, observacao")
    .eq("user_id", userId)
    .order("data", { ascending: false });

  const todos = (checkins ?? []) as Array<{ semana: number; data: string }>;
  const daSemana = todos.filter((c) => c.semana === semanaAtual);

  return {
    isPremium: await ehPremium(userId),
    semanaAtual,
    iniciadaEm: progresso?.iniciada_em ?? null,
    concluidaEm: progresso?.concluida_em ?? null,
    hoje,
    checkinHoje: todos.some((c) => c.data === hoje),
    diasNaSemana: daSemana.length,
    totalCheckins: todos.length,
    sequencia: calcularSequencia(todos.map((c) => c.data), hoje),
    podeAvancar: daSemana.length >= MIN_DIAS_AVANCAR && semanaAtual < 4,
    datasSemana: daSemana.map((c) => c.data),
  };
}

export const getRotina = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => carregarEstado(context as unknown as Ctx));

export const registrarCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ observacao: z.string().max(500).optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    const ctx = context as unknown as Ctx;
    if (!(await ehPremium(ctx.userId))) {
      throw new Error("A Rotina faz parte do Plano Zero Lipedema.");
    }
    const estadoAtual = await carregarEstado(ctx);
    // upsert por (user_id, data): tocar duas vezes não duplica nem falha.
    const { error } = await ctx.supabase.from("rotina_checkins").upsert(
      {
        user_id: ctx.userId,
        semana: estadoAtual.semanaAtual,
        data: estadoAtual.hoje,
        observacao: data.observacao ?? null,
      },
      { onConflict: "user_id,data" },
    );
    if (error) throw new Error(error.message);
    return carregarEstado(ctx);
  });

export const desfazerCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const { error } = await ctx.supabase
      .from("rotina_checkins")
      .delete()
      .eq("user_id", ctx.userId)
      .eq("data", hojeISO());
    if (error) throw new Error(error.message);
    return carregarEstado(ctx);
  });

export const avancarSemana = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    if (!(await ehPremium(ctx.userId))) {
      throw new Error("A Rotina faz parte do Plano Zero Lipedema.");
    }
    const estado = await carregarEstado(ctx);
    // A semana nunca volta sozinha: só avança.
    if (estado.semanaAtual >= 4) {
      await ctx.supabase
        .from("rotina_progresso")
        .update({ concluida_em: new Date().toISOString() })
        .eq("user_id", ctx.userId)
        .is("concluida_em", null);
      return carregarEstado(ctx);
    }
    const { error } = await ctx.supabase
      .from("rotina_progresso")
      .update({ semana_atual: estado.semanaAtual + 1 })
      .eq("user_id", ctx.userId);
    if (error) throw new Error(error.message);
    return carregarEstado(ctx);
  });

export const concluirRotina = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const { error } = await ctx.supabase
      .from("rotina_progresso")
      .update({ concluida_em: new Date().toISOString() })
      .eq("user_id", ctx.userId)
      .is("concluida_em", null);
    if (error) throw new Error(error.message);
    return carregarEstado(ctx);
  });
