import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { getMetricasUnificadas } from "@/lib/meta-ads.functions";

export const Route = createFileRoute("/admin/metricas")({
  component: MetricasPage,
});

type Dados = Awaited<ReturnType<typeof getMetricasUnificadas>>;

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const int = (n: number) => Math.round(n).toLocaleString("pt-BR");

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function MetricasPage() {
  const carregar = useServerFn(getMetricasUnificadas);
  const [since, setSince] = useState(fmtDate(new Date(Date.now() - 6 * 86_400_000)));
  const [until, setUntil] = useState(fmtDate(new Date()));
  const [dados, setDados] = useState<Dados | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const r = await carregar({ data: { since, until } });
      setDados(r);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui carregar as métricas.");
    } finally {
      setLoading(false);
    }
  }, [carregar, since, until]);

  useEffect(() => {
    void buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meta = dados?.meta ?? null;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B8974D]">
            Performance
          </p>
          <h1
            className="mt-1 text-3xl italic text-[#0B2A4A]"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            Métricas unificadas
          </h1>
          <p className="mt-1 text-sm text-[#3E4F65]">
            Investimento no Meta lado a lado com o que realmente aconteceu no banco.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            className="rounded-xl border border-[#E5DBC3] bg-white px-3 py-2 text-sm text-[#0B2A4A]"
          />
          <span className="text-sm text-[#8A7C5C]">até</span>
          <input
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="rounded-xl border border-[#E5DBC3] bg-white px-3 py-2 text-sm text-[#0B2A4A]"
          />
          <button
            onClick={() => void buscar()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#0B2A4A] px-4 py-2 text-sm font-semibold text-[#F7F2E8] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Atualizar
          </button>
        </div>
      </header>

      {erro && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {erro}
        </div>
      )}

      {dados?.erroMeta && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Não consegui ler os dados do Meta agora: {dados.erroMeta}. Os números do
            banco abaixo continuam válidos.
          </span>
        </div>
      )}

      {loading && !dados ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="size-6 animate-spin text-[#0B2A4A]" />
        </div>
      ) : dados ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Gasto (Meta)" value={brl(meta?.totals.spend ?? 0)} />
            <Card label="CPM médio" value={brl(meta?.totals.cpm ?? 0)} />
            <Card label="Cliques" value={int(meta?.totals.clicks ?? 0)} />
            <Card
              label="Resultados (Meta)"
              value={int(meta?.totals.leads ?? 0)}
              hint="Leads reportados pela própria Meta"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Leads no banco" value={int(dados.funil.total)} tone="navy" />
            <Card
              label="Quiz com WhatsApp válido"
              value={int(dados.funil.comTelefone)}
              hint="Exclui telefone pendente"
              tone="navy"
            />
            <Card
              label="Compras reais"
              value={int(dados.funil.planoAtivo)}
              hint="Status plano_ativo (Kiwify)"
              tone="navy"
            />
            <Card
              label="CAC real"
              value={dados.cacReal != null ? brl(dados.cacReal) : "—"}
              hint="Gasto ÷ compras reais"
              tone="gold"
            />
          </div>

          <section className="rounded-2xl border border-[#E5DBC3] bg-[#FBF6EB]/70 p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#8A7C5C]">
              Leads por status
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(dados.funil.porStatus).length === 0 && (
                <p className="text-sm text-[#3E4F65]">Nenhum lead nesse período.</p>
              )}
              {Object.entries(dados.funil.porStatus).map(([status, count]) => (
                <span
                  key={status}
                  className="rounded-full bg-[#EFE5CE] px-3 py-1 text-xs font-semibold text-[#0B2A4A]"
                >
                  {status}: {count}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-[#8A7C5C]">
              Custo por lead real (com WhatsApp):{" "}
              {dados.custoPorLeadReal != null ? brl(dados.custoPorLeadReal) : "—"}
            </p>
          </section>

          <section className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[#8A7C5C]">
              <BarChart3 className="size-4" /> Por anúncio
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5DBC3] text-[11px] uppercase tracking-wider text-[#8A7C5C]">
                    <th className="py-2 pr-3">Campanha / Conjunto / Anúncio</th>
                    <th className="py-2 pr-3">Gasto</th>
                    <th className="py-2 pr-3">CPM</th>
                    <th className="py-2 pr-3">CPC</th>
                    <th className="py-2 pr-3">CTR</th>
                    <th className="py-2 pr-3">Cliques</th>
                    <th className="py-2">Leads (Meta)</th>
                  </tr>
                </thead>
                <tbody>
                  {(meta?.rows ?? []).map((r) => (
                    <tr key={r.adId} className="border-b border-[#F0E8D6]">
                      <td className="py-2 pr-3">
                        <p className="font-semibold text-[#0B2A4A]">{r.adName}</p>
                        <p className="text-xs text-[#8A7C5C]">
                          {r.campaignName} · {r.adsetName}
                        </p>
                      </td>
                      <td className="py-2 pr-3">{brl(r.spend)}</td>
                      <td className="py-2 pr-3">{brl(r.cpm)}</td>
                      <td className="py-2 pr-3">{brl(r.cpc)}</td>
                      <td className="py-2 pr-3">{r.ctr.toFixed(2)}%</td>
                      <td className="py-2 pr-3">{int(r.clicks)}</td>
                      <td className="py-2 font-semibold">{int(r.leads)}</td>
                    </tr>
                  ))}
                  {(!meta || meta.rows.length === 0) && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[#8A7C5C]">
                        Sem dados de anúncios nesse período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {meta?.tokenExpiresAt && (
              <p className="mt-3 text-[11px] text-[#8A7C5C]">
                Token do Meta válido até{" "}
                {new Date(meta.tokenExpiresAt).toLocaleDateString("pt-BR")}
                {meta.tokenRenewed ? " (renovado agora)" : ""}.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Card({
  label,
  value,
  hint,
  tone = "cream",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "cream" | "navy" | "gold";
}) {
  const styles =
    tone === "navy"
      ? "border-[#0B2A4A]/15 bg-[#0B2A4A] text-[#F7F2E8]"
      : tone === "gold"
        ? "border-[#B8974D]/40 bg-[#B8974D]/15 text-[#0B2A4A]"
        : "border-[#E5DBC3] bg-[#FBF6EB]/80 text-[#0B2A4A]";
  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-[11px] opacity-70">{hint}</p>}
    </div>
  );
}
