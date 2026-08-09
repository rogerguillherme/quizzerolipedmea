import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Loader2, TrendingUp } from "lucide-react";
import { getFunilReal, type FunilReal } from "@/lib/funil.functions";

const PERIODOS = [7, 14, 30] as const;

/** Nunca inventa número: sem dado no banco, a célula diz "sem dados". */
function Valor({ n }: { n: number | null }) {
  if (n == null) return <span className="text-[#8A7C5C]">sem dados</span>;
  return <>{n.toLocaleString("pt-BR")}</>;
}

export function FunilPanel() {
  const carregar = useServerFn(getFunilReal);
  const [dias, setDias] = useState<7 | 14 | 30>(7);
  const [dados, setDados] = useState<FunilReal | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const buscar = useCallback(
    async (d: 7 | 14 | 30) => {
      setLoading(true);
      setErro(null);
      try {
        setDados(await carregar({ data: { dias: d } }));
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não consegui ler o funil.");
      } finally {
        setLoading(false);
      }
    },
    [carregar],
  );

  useEffect(() => {
    void buscar(dias);
  }, [buscar, dias]);

  const base = dados?.funil[0]?.valor ?? null;

  return (
    <section className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[#8A7C5C]">
          <TrendingUp className="size-4" /> Funil real (banco)
        </h2>
        <div className="flex items-center gap-1">
          {PERIODOS.map((p) => (
            <button
              key={p}
              onClick={() => setDias(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                dias === p
                  ? "bg-[#0B2A4A] text-[#F7F2E8]"
                  : "border border-[#E5DBC3] text-[#0B2A4A] hover:bg-[#F5EFE1]"
              }`}
            >
              {p} dias
            </button>
          ))}
        </div>
      </header>

      {erro && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {erro}
        </div>
      )}

      {loading && !dados ? (
        <div className="grid place-items-center py-12">
          <Loader2 className="size-5 animate-spin text-[#0B2A4A]" />
        </div>
      ) : dados ? (
        <div className="space-y-6">
          {!dados.temEventos && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Ainda não chegou nenhum evento de funil nesse período. Depois de publicar,
              os eventos passam a ser gravados a cada visita e etapa do quiz.
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5DBC3] text-[11px] uppercase tracking-wider text-[#8A7C5C]">
                  <th className="py-2 pr-3">Etapa</th>
                  <th className="py-2 pr-3">Absoluto</th>
                  <th className="py-2">% das visitas</th>
                </tr>
              </thead>
              <tbody>
                {dados.funil.map((f) => (
                  <tr key={f.etapa} className="border-b border-[#F0E8D6]">
                    <td className="py-2 pr-3 font-semibold text-[#0B2A4A]">{f.etapa}</td>
                    <td className="py-2 pr-3">
                      <Valor n={f.valor} />
                    </td>
                    <td className="py-2 text-[#3E4F65]">
                      {f.valor != null && base ? `${((f.valor / base) * 100).toFixed(1)}%` : "sem dados"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8A7C5C]">
              Abandono por pergunta do quiz
            </h3>
            {dados.perguntas.length === 0 ? (
              <p className="text-sm text-[#8A7C5C]">sem dados</p>
            ) : (
              <div className="space-y-1">
                {dados.perguntas.map((p, i) => {
                  const anterior = i === 0 ? p.alcancaram : dados.perguntas[i - 1].alcancaram;
                  const queda = anterior ? 1 - p.alcancaram / anterior : 0;
                  return (
                    <div key={p.pergunta} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 text-[#0B2A4A]">Pergunta {p.pergunta}</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#F0E8D6]">
                        <div
                          className="h-full rounded-full bg-[#0B2A4A]"
                          style={{
                            width: `${dados.perguntas[0].alcancaram ? (p.alcancaram / dados.perguntas[0].alcancaram) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="w-28 shrink-0 text-right text-[#3E4F65]">
                        {p.alcancaram} {i > 0 && queda > 0 ? `(-${(queda * 100).toFixed(0)}%)` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8A7C5C]">
              Por funil de origem
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5DBC3] text-[11px] uppercase tracking-wider text-[#8A7C5C]">
                    <th className="py-2 pr-3">Funil</th>
                    <th className="py-2 pr-3">Visitas</th>
                    <th className="py-2 pr-3">Quiz concluído</th>
                    <th className="py-2 pr-3">Lead com WhatsApp</th>
                    <th className="py-2">Compra</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.porFunil.map((f) => (
                    <tr key={f.chave} className="border-b border-[#F0E8D6]">
                      <td className="py-1.5 pr-3 text-[#0B2A4A]">
                        {f.chave === "quizz" ? "/quizz" : f.chave === "meu-mapa" ? "/meu-mapa" : f.chave}
                      </td>
                      <td className="py-1.5 pr-3 text-[#3E4F65]">{f.visitas}</td>
                      <td className="py-1.5 pr-3 text-[#3E4F65]">{f.concluidos}</td>
                      <td className="py-1.5 pr-3 text-[#3E4F65]">{f.leads}</td>
                      <td className="py-1.5 text-[#3E4F65]">{f.compras}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Quebra titulo="Por campanha" linhas={dados.porCampanha} />
            <Quebra titulo="Por conteúdo (criativo)" linhas={dados.porConteudo} />
            <Quebra titulo="Por fonte" linhas={dados.porFonte} />
          </div>


          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8A7C5C]">
              Série diária
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5DBC3] text-[11px] uppercase tracking-wider text-[#8A7C5C]">
                    <th className="py-2 pr-3">Dia</th>
                    <th className="py-2 pr-3">Visitas</th>
                    <th className="py-2">Leads</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.serie.map((d) => (
                    <tr key={d.data} className="border-b border-[#F0E8D6]">
                      <td className="py-1.5 pr-3">
                        {new Date(`${d.data}T12:00:00`).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-1.5 pr-3">{d.visitas}</td>
                      <td className="py-1.5">{d.leads}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[11px] text-[#8A7C5C]">
            Acessos de robô descartados desde o início do filtro: {dados.descartesBot.toLocaleString("pt-BR")}.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Quebra({
  titulo,
  linhas,
}: {
  titulo: string;
  linhas: { chave: string; visitas: number; leads: number; vendas: number }[];
}) {
  return (
    <div className="rounded-xl border border-[#E5DBC3] bg-[#FBF6EB]/60 p-4">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8A7C5C]">
        {titulo}
      </h3>
      {linhas.length === 0 ? (
        <p className="text-sm text-[#8A7C5C]">sem dados</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {linhas.map((l) => (
            <li key={l.chave} className="flex items-center justify-between gap-2">
              <span className="truncate text-[#0B2A4A]" title={l.chave}>
                {l.chave}
              </span>
              <span className="shrink-0 text-xs text-[#3E4F65]">
                {l.visitas} vis · {l.leads} leads · {l.vendas} vendas
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
