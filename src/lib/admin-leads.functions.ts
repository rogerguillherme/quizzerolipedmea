import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listQuizLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Acesso restrito.");

    const { data, error } = await context.supabase
      .from("leads")
      .select("id, nome, telefone, respostas, diagnostico, status, origem, created_at")
      .eq("origem", "mapa")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  });

/**
 * KPIs do painel calculados a partir dos dados reais do banco (tabela `leads`),
 * nunca de dados de demonstração no navegador.
 */
export const getDashboardKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Acesso restrito.");

    const { data, error } = await context.supabase
      .from("leads")
      .select("status, telefone, origem")
      .limit(5000);
    if (error) throw error;

    const rows = data ?? [];
    // "Mapa completo" = veio do quiz e deixou um telefone real (não "pendente").
    const mapasCompletos = rows.filter(
      (r) => r.origem === "mapa" && !!r.telefone && r.telefone !== "pendente",
    ).length;
    const compras = rows.filter((r) => r.status === "plano_ativo").length;

    return {
      leads: rows.length,
      mapasCompletos,
      compras,
      conversao: mapasCompletos > 0 ? compras / mapasCompletos : null,
    };
  });

