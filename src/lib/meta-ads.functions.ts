import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const rangeSchema = z.object({
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

function defaultRange() {
  const until = new Date();
  const since = new Date(Date.now() - 6 * 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { since: fmt(since), until: fmt(until) };
}

export const getMetricasUnificadas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => rangeSchema.parse(i ?? {}))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito.");

    const fallback = defaultRange();
    const since = data.since ?? fallback.since;
    const until = data.until ?? fallback.until;

    const { fetchMetaInsights, fetchSupabaseFunnel } = await import(
      "@/lib/meta-ads.server"
    );

    const [metaResult, funil] = await Promise.all([
      fetchMetaInsights(since, until).catch((err: unknown) => ({
        erro: err instanceof Error ? err.message : "Erro desconhecido no Meta",
      })),
      fetchSupabaseFunnel(since, until),
    ]);

    const meta = "erro" in metaResult ? null : metaResult;
    const erroMeta = "erro" in metaResult ? metaResult.erro : null;

    const gasto = meta?.totals.spend ?? 0;
    const cacReal = funil.planoAtivo > 0 ? gasto / funil.planoAtivo : null;
    const custoPorLeadReal = funil.comTelefone > 0 ? gasto / funil.comTelefone : null;

    return { since, until, meta, erroMeta, funil, cacReal, custoPorLeadReal };
  });
