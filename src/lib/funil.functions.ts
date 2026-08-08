import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type FunilReal = Awaited<ReturnType<typeof getFunilReal>>;

/**
 * Funil lido do banco (page_views + eventos + leads). Onde não houver dado,
 * devolvemos null para a tela escrever "sem dados" em vez de inventar zero.
 */
export const getFunilReal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ dias: z.union([z.literal(7), z.literal(14), z.literal(30)]).default(7) }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const desde = new Date(Date.now() - data.dias * 86_400_000).toISOString();

    const [{ data: views }, { data: eventos }, { data: leads }, { data: descartes }] =
      await Promise.all([
        supabaseAdmin
          .from("page_views")
          .select("path, session_id, created_at")
          .gte("created_at", desde),
        supabaseAdmin
          .from("eventos")
          .select("nome, session_id, lead_id, meta, utm_source, utm_campaign, utm_content, created_at")
          .gte("created_at", desde)
          .limit(20000),
        supabaseAdmin
          .from("leads")
          .select("id, telefone, status, respostas, created_at")
          .gte("created_at", desde),
        supabaseAdmin
          .from("app_settings")
          .select("value")
          .eq("app_key", "mapa")
          .eq("setting_key", "track_descartes_bot")
          .maybeSingle(),
      ]);

    const rowsViews = views ?? [];
    const rowsEventos = eventos ?? [];
    const rowsLeads = leads ?? [];

    const sessoesUnicas = new Set(rowsViews.map((v) => v.session_id).filter(Boolean));
    const sessoesPorEvento = (nome: string) =>
      new Set(rowsEventos.filter((e) => e.nome === nome).map((e) => e.session_id ?? e.lead_id ?? "")).size;

    const comTelefone = rowsLeads.filter(
      (l) => l.telefone && l.telefone !== "pendente" && l.telefone.replace(/\D/g, "").length >= 10,
    ).length;
    const compras = rowsLeads.filter((l) => l.status === "plano_ativo").length;

    const visitas = sessoesUnicas.size || rowsViews.length;

    const funil = [
      { etapa: "Visitas", valor: rowsViews.length ? visitas : null },
      { etapa: "Quiz iniciado", valor: rowsEventos.length ? sessoesPorEvento("quiz_started") : null },
      { etapa: "Quiz concluído", valor: rowsEventos.length ? sessoesPorEvento("quiz_completed") : null },
      { etapa: "Lead com WhatsApp", valor: rowsLeads.length ? comTelefone : null },
      { etapa: "Checkout", valor: rowsEventos.length ? sessoesPorEvento("checkout_view") : null },
      { etapa: "Compra", valor: rowsLeads.length ? compras : null },
    ];

    // Abandono por pergunta do quiz.
    const porPergunta = new Map<number, Set<string>>();
    for (const e of rowsEventos) {
      if (e.nome !== "quiz_step") continue;
      const m = (e.meta ?? {}) as Record<string, unknown>;
      const n = Number(m.pergunta);
      if (!Number.isFinite(n)) continue;
      if (!porPergunta.has(n)) porPergunta.set(n, new Set());
      porPergunta.get(n)!.add(String(e.session_id ?? Math.random()));
    }
    const perguntas = [...porPergunta.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([pergunta, s]) => ({ pergunta, alcancaram: s.size }));

    // Quebra por campanha / conteúdo / fonte, com leads e vendas.
    function quebra(campo: "utm_campaign" | "utm_content" | "utm_source") {
      const mapa = new Map<string, { visitas: Set<string>; leads: Set<string>; vendas: number }>();
      for (const e of rowsEventos) {
        const chave = (e[campo] as string | null) ?? "(sem utm)";
        if (!mapa.has(chave)) mapa.set(chave, { visitas: new Set(), leads: new Set(), vendas: 0 });
        const bucket = mapa.get(chave)!;
        if (e.session_id) bucket.visitas.add(e.session_id);
        if (e.nome === "quiz_completed" && e.lead_id) bucket.leads.add(e.lead_id);
        if (e.nome === "purchase_completed") bucket.vendas += 1;
      }
      return [...mapa.entries()]
        .map(([chave, v]) => ({
          chave,
          visitas: v.visitas.size,
          leads: v.leads.size,
          vendas: v.vendas,
        }))
        .sort((a, b) => b.visitas - a.visitas)
        .slice(0, 15);
    }

    // Série diária.
    const dias: Record<string, { visitas: number; leads: number }> = {};
    for (let i = data.dias - 1; i >= 0; i--) {
      dias[new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)] = {
        visitas: 0,
        leads: 0,
      };
    }
    for (const v of rowsViews) {
      const k = String(v.created_at).slice(0, 10);
      if (dias[k]) dias[k].visitas += 1;
    }
    for (const l of rowsLeads) {
      const k = String(l.created_at).slice(0, 10);
      if (dias[k]) dias[k].leads += 1;
    }

    return {
      dias: data.dias,
      temEventos: rowsEventos.length > 0,
      funil,
      perguntas,
      porCampanha: quebra("utm_campaign"),
      porConteudo: quebra("utm_content"),
      porFonte: quebra("utm_source"),
      serie: Object.entries(dias).map(([data_, v]) => ({ data: data_, ...v })),
      descartesBot: Number((descartes?.value as { total?: number } | null)?.total ?? 0),
    };
  });
