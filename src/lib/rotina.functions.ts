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
import { hojeISO, diasEntre } from "@/lib/data-local";


/**
 * Sequência com perdão (padrão de apps de hábito).
 *
 * Um dia perdido não apaga semanas de esforço: a sequência só quebra depois
 * de 2 dias seguidos sem check-in. Além disso, cada 7 dias cobertos pela
 * sequência concede 1 "dia de graça" extra, então faltar 1 dia por semana
 * mantém a contagem viva.
 *
 * A contagem devolvida é de dias com check-in de verdade (dias de graça não
 * entram no número).
 */
function calcularSequencia(datas: readonly string[], hoje: string): number {
  const unicas = Array.from(new Set(datas)).sort().reverse();
  if (unicas.length === 0) return 0;

  // Ainda dentro da janela de tolerância? (hoje, ontem ou anteontem)
  const gapInicial = diasEntre(hoje, unicas[0]!);
  if (gapInicial > 2) return 0;

  let seq = 1;
  let gracasUsadas = gapInicial === 2 ? 1 : 0;
  let diasCobertos = gapInicial;

  const gracasDisponiveis = () => 1 + Math.floor(diasCobertos / 7);

  if (gracasUsadas > gracasDisponiveis()) return 0;

  for (let i = 1; i < unicas.length; i++) {
    const gap = diasEntre(unicas[i - 1]!, unicas[i]!);
    if (gap <= 0) continue;
    // 3+ dias de distância = 2 dias seguidos sem check-in: quebra de vez.
    if (gap > 2) break;
    diasCobertos += gap;
    if (gap === 2) {
      if (gracasUsadas + 1 > gracasDisponiveis()) break;
      gracasUsadas += 1;
    }
    seq++;
  }
  return seq;
}

/**
 * Recorde: maior sequência já alcançada, com a mesma regra de perdão.
 * O recorde nunca cai, mesmo depois de a sequência atual quebrar.
 */
function calcularRecorde(datas: readonly string[]): number {
  const unicas = Array.from(new Set(datas)).sort();
  if (unicas.length === 0) return 0;
  let melhor = 1;
  let atual = 1;
  let gracasUsadas = 0;
  let diasCobertos = 0;
  for (let i = 1; i < unicas.length; i++) {
    const gap = diasEntre(unicas[i]!, unicas[i - 1]!);
    const gracas = 1 + Math.floor(diasCobertos / 7);
    if (gap === 1 || (gap === 2 && gracasUsadas + 1 <= gracas)) {
      if (gap === 2) gracasUsadas += 1;
      diasCobertos += gap;
      atual++;
    } else {
      atual = 1;
      gracasUsadas = 0;
      diasCobertos = 0;
    }
    if (atual > melhor) melhor = atual;
  }
  return melhor;
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

  // Usuária nova (ou linha recém-criada): sempre cai na Semana 1, nunca NaN.
  const bruta = Number(progresso?.semana_atual);
  const semanaAtual = Number.isFinite(bruta) ? Math.min(4, Math.max(1, bruta)) : 1;


  const { data: checkins } = await supabase
    .from("rotina_checkins")
    .select("id, semana, data, observacao")
    .eq("user_id", userId)
    .order("data", { ascending: false });

  const todos = (checkins ?? []) as Array<{ semana: number; data: string }>;
  const daSemana = todos.filter((c) => c.semana === semanaAtual);

  // Semanas consideradas concluídas: as anteriores à atual, mais a atual
  // quando a rotina inteira já foi encerrada.
  const semanasConcluidas = Array.from({ length: 4 }, (_, i) => i + 1).filter(
    (n) => n < semanaAtual || (Boolean(progresso?.concluida_em) && n <= semanaAtual),
  );


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
    recorde: calcularRecorde(todos.map((c) => c.data)),
    podeAvancar: daSemana.length >= MIN_DIAS_AVANCAR && semanaAtual < 4,
    datasSemana: daSemana.map((c) => c.data),
    /** Todas as datas de check-in (YYYY-MM-DD), mais recentes primeiro. */
    todasDatas: todos.map((c) => c.data),
    semanasConcluidas,
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
