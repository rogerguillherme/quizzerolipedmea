import { useState } from "react";
import { X, Copy, Check, Search, Link2, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { searchLeads, linkConversationLead } from "@/lib/crm.functions";
import {
  LABELS_Q,
  ORDEM_Q,
  dataCurta,
  rotuloStatusLead,
} from "@/lib/crm-labels";

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const BORDER = "rgba(216,198,160,0.6)";

export type LeadCRM = {
  id: string;
  nome: string | null;
  telefone: string | null;
  status: string | null;
  origem?: string | null;
  created_at: string | null;
  respostas: Record<string, unknown> | null;
  diagnostico: {
    estagio?: string;
    descricaoEstagio?: string;
    prioridades?: string[];
  } | null;
} | null;

export type LeadPanelProps = {
  conversaId: string;
  telefone: string;
  lead: LeadCRM;
  onClose: () => void;
  onVinculado: () => void;
};

function textoResumo(lead: NonNullable<LeadCRM>, telefone: string) {
  const r = (lead.respostas ?? {}) as Record<string, unknown>;
  const atr = (r.atribuicao ?? {}) as Record<string, unknown>;
  const linhas: string[] = [];
  linhas.push(`RESUMO DO MAPA — ${lead.nome ?? "Sem nome"} (${lead.telefone ?? telefone})`);
  linhas.push("");
  if (lead.diagnostico?.estagio) {
    linhas.push(`Estágio percebido: ${lead.diagnostico.estagio}`);
    if (lead.diagnostico.descricaoEstagio)
      linhas.push(lead.diagnostico.descricaoEstagio);
    linhas.push("");
  }
  if (lead.diagnostico?.prioridades?.length) {
    linhas.push("Prioridades:");
    lead.diagnostico.prioridades.forEach((p, i) => linhas.push(`${i + 1}. ${p}`));
    linhas.push("");
  }
  linhas.push("Respostas do quiz:");
  for (const k of ORDEM_Q) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) linhas.push(`- ${LABELS_Q[k]}: ${v}`);
  }
  linhas.push("");
  linhas.push(`Mapa feito em: ${dataCurta(lead.created_at)}`);
  linhas.push(`Status: ${rotuloStatusLead(lead.status)}`);
  linhas.push(`Comprou: ${lead.status === "plano_ativo" ? "sim" : "não"}`);
  linhas.push(`Funil: ${String(r.funil ?? "—")}`);
  linhas.push(
    `Campanha (1º toque): ${String(atr.utm_campaign ?? atr.utm_source ?? "—")}`,
  );
  return linhas.join("\n");
}

export function LeadPanel({
  conversaId,
  telefone,
  lead,
  onClose,
  onVinculado,
}: LeadPanelProps) {
  const [copiado, setCopiado] = useState(false);
  const [termo, setTermo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<
    Array<{ id: string; nome: string; telefone: string }>
  >([]);
  const buscar = useServerFn(searchLeads);
  const vincular = useServerFn(linkConversationLead);

  const r = (lead?.respostas ?? {}) as Record<string, unknown>;
  const atr = (r.atribuicao ?? {}) as Record<string, unknown>;

  async function copiar() {
    if (!lead) return;
    try {
      await navigator.clipboard.writeText(textoResumo(lead, telefone));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      setCopiado(false);
    }
  }

  async function fazerBusca() {
    if (termo.trim().length < 2) return;
    setBuscando(true);
    try {
      const res = (await buscar({ data: { termo: termo.trim() } })) as Array<{
        id: string;
        nome: string;
        telefone: string;
      }>;
      setResultados(res);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-[#16324F]/40"
      />
      <aside
        className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[420px] sm:max-h-none sm:rounded-none"
        style={{ background: "#FFFDF7", borderLeft: `1px solid ${BORDER}` }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
          style={{ background: "#FFFDF7", borderBottom: `1px solid ${BORDER}` }}
        >
          <p
            className="text-[10px] font-bold uppercase"
            style={{ letterSpacing: "0.22em", color: GOLD }}
          >
            Ficha do Mapa
          </p>
          <button
            onClick={onClose}
            className="grid size-11 place-items-center rounded-full hover:bg-[#EFE5CE]"
          >
            <X className="size-4" style={{ color: NAVY }} />
          </button>
        </div>

        {!lead ? (
          <div className="space-y-4 p-4">
            <p className="text-sm font-semibold" style={{ color: NAVY }}>
              Sem Mapa vinculado
            </p>
            <p className="text-[13px] text-[#5C5749]">
              Não encontrei nenhum Mapa com esse número. Busque pelo nome ou por
              outro telefone e vincule à conversa.
            </p>
            <div
              className="flex items-center gap-2 rounded-xl px-3"
              style={{ background: "#FFF", border: `1px solid ${BORDER}` }}
            >
              <Search className="size-4" style={{ color: GOLD }} />
              <input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fazerBusca()}
                placeholder="Nome ou telefone"
                className="min-h-11 flex-1 bg-transparent text-sm outline-none"
              />
              <button
                onClick={fazerBusca}
                className="min-h-11 px-2 text-xs font-bold"
                style={{ color: NAVY }}
              >
                {buscando ? <Loader2 className="size-4 animate-spin" /> : "Buscar"}
              </button>
            </div>
            <div className="space-y-1.5">
              {resultados.map((l) => (
                <button
                  key={l.id}
                  onClick={async () => {
                    await vincular({ data: { id: conversaId, leadId: l.id } });
                    onVinculado();
                  }}
                  className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm"
                  style={{ border: `1px solid ${BORDER}`, color: NAVY }}
                >
                  <span>
                    <span className="font-semibold">{l.nome}</span>
                    <span className="block text-[11px] text-[#5C5749]">
                      {l.telefone}
                    </span>
                  </span>
                  <Link2 className="size-4" style={{ color: GOLD }} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 p-4">
            <section>
              <p
                className="text-[10px] font-bold uppercase"
                style={{ letterSpacing: "0.2em", color: GOLD }}
              >
                Estágio percebido
              </p>
              <p
                className="mt-1 text-lg italic"
                style={{ fontFamily: '"Playfair Display", serif', color: NAVY }}
              >
                {lead.diagnostico?.estagio ?? "Sem leitura gerada"}
              </p>
              {lead.diagnostico?.descricaoEstagio && (
                <p className="mt-1 text-[13px] leading-relaxed text-[#2F3128]">
                  {lead.diagnostico.descricaoEstagio}
                </p>
              )}
            </section>

            {!!lead.diagnostico?.prioridades?.length && (
              <section>
                <p
                  className="text-[10px] font-bold uppercase"
                  style={{ letterSpacing: "0.2em", color: GOLD }}
                >
                  As 3 prioridades
                </p>
                <ol className="mt-2 space-y-2">
                  {lead.diagnostico.prioridades.map((p, i) => (
                    <li
                      key={i}
                      className="rounded-xl px-3 py-2 text-[13px]"
                      style={{ background: "#F7F2E8", color: NAVY }}
                    >
                      <span className="font-bold" style={{ color: GOLD }}>
                        {i + 1}.
                      </span>{" "}
                      {p}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section>
              <p
                className="text-[10px] font-bold uppercase"
                style={{ letterSpacing: "0.2em", color: GOLD }}
              >
                Respostas do quiz
              </p>
              <dl className="mt-2 space-y-2">
                {ORDEM_Q.map((k) => {
                  const v = r[k];
                  if (typeof v !== "string" || !v.trim()) return null;
                  return (
                    <div
                      key={k}
                      className="border-b pb-1.5"
                      style={{ borderColor: BORDER }}
                    >
                      <dt className="text-[11px] font-semibold text-[#8A7C5C]">
                        {LABELS_Q[k]}
                      </dt>
                      <dd className="text-[13px]" style={{ color: NAVY }}>
                        {v}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>

            <section>
              <p
                className="text-[10px] font-bold uppercase"
                style={{ letterSpacing: "0.2em", color: GOLD }}
              >
                Ficha rápida
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                {[
                  ["Mapa em", dataCurta(lead.created_at)],
                  ["Status", rotuloStatusLead(lead.status)],
                  ["Comprou", lead.status === "plano_ativo" ? "Sim" : "Não"],
                  ["Funil", String(r.funil ?? "—")],
                  [
                    "Campanha",
                    String(atr.utm_campaign ?? atr.utm_source ?? "—"),
                  ],
                  ["Telefone", lead.telefone ?? telefone],
                ].map(([label, valor]) => (
                  <div
                    key={label}
                    className="rounded-xl px-3 py-2"
                    style={{ background: "#F7F2E8" }}
                  >
                    <dt className="text-[10px] uppercase text-[#8A7C5C]">
                      {label}
                    </dt>
                    <dd className="font-semibold" style={{ color: NAVY }}>
                      {valor}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <button
              onClick={copiar}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-bold"
              style={{ background: NAVY, color: "#F7F2E8" }}
            >
              {copiado ? (
                <>
                  <Check className="size-4" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="size-4" /> Copiar resumo
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
