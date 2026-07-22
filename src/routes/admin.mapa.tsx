import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Filter, Search, MessageCircle, Send } from "lucide-react";
import {
  getEvents,
  getLeads,
  getEscalations,
  saveEscalations,
  seedAdminDemoIfEmpty,
  type Lead,
  type LeadStatus,
} from "@/lib/analytics";

export const Route = createFileRoute("/admin/mapa")({
  component: MapaAdminPage,
});

const STATUS_LABELS: Record<LeadStatus, string> = {
  mapa_iniciado: "Mapa iniciado",
  mapa_completo: "Mapa completo",
  checkout: "No checkout",
  desafio_ativo: "Desafio ativo",
  desafio_parado: "Parada há dias",
  desafio_completo: "Desafio completo",
  reembolso: "Pediu reembolso",
  metodo_derma: "Método Derma",
};

function MapaAdminPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    seedAdminDemoIfEmpty();
    setReady(true);
  }, []);

  const events = useMemo(() => (ready ? getEvents() : []), [ready]);
  const leads = useMemo(() => (ready ? getLeads() : []), [ready]);

  const counts: Record<string, number> = {};
  for (const e of events) counts[e.name] = (counts[e.name] || 0) + 1;

  const steps = [
    { key: "landing_view", label: "Abriu o link" },
    { key: "quiz_started", label: "Iniciou o Mapa" },
    { key: "quiz_completed", label: "Completou o Mapa" },
    { key: "checkout_view", label: "Chegou ao checkout" },
    { key: "purchase_completed", label: "Comprou o Desafio" },
  ];
  const top = counts[steps[0].key] || 1;

  return (
    <div>
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B8974D]">
          App · Mapa do Lipedema
        </p>
        <h1
          className="mt-1 text-3xl italic text-[#0B2A4A]"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Cadastros, funil e fila
        </h1>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#8A7C5C]">
          Funil de conversão
        </h2>
        <div className="mt-3 space-y-2">
          {steps.map((s, i) => {
            const n = counts[s.key] || 0;
            const pct = Math.round((n / top) * 100);
            const prev = i > 0 ? counts[steps[i - 1].key] || 0 : 0;
            const conv = i > 0 && prev > 0 ? Math.round((n / prev) * 100) : null;
            return (
              <div
                key={s.key}
                className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-4"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#0B2A4A]">{s.label}</span>
                  <span className="tabular-nums font-bold text-[#0B2A4A]">
                    {n}
                    {conv !== null && (
                      <span className="ml-2 text-xs font-normal text-[#8A7C5C]">
                        · {conv}%
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#EFE5CE]">
                  <div
                    className="h-full rounded-full bg-[#0B2A4A]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#8A7C5C]">
          Leads ({leads.length})
        </h2>
        <LeadsList leads={leads} />
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#8A7C5C]">
          Fila de escalonamento
        </h2>
        <FilaView />
      </section>
    </div>
  );
}

function LeadsList({ leads }: { leads: Lead[] }) {
  const [filtro, setFiltro] = useState<"todos" | LeadStatus>("todos");
  const [busca, setBusca] = useState("");
  const filtered = leads.filter((l) => {
    if (filtro !== "todos" && l.status !== filtro) return false;
    if (busca && !`${l.nome} ${l.telefone}`.toLowerCase().includes(busca.toLowerCase()))
      return false;
    return true;
  });
  const filtros: ("todos" | LeadStatus)[] = [
    "todos",
    "desafio_ativo",
    "desafio_parado",
    "reembolso",
    "metodo_derma",
  ];
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 rounded-xl border border-[#E5DBC3] bg-white/70 px-3">
        <Search className="size-4 text-[#8A7C5C]" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone"
          className="flex-1 bg-transparent py-2 text-sm outline-none"
        />
      </div>
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="size-4 shrink-0 text-[#8A7C5C]" />
        {filtros.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={[
              "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
              filtro === f
                ? "border-[#0B2A4A] bg-[#0B2A4A] text-[#F7F2E8]"
                : "border-[#E5DBC3] bg-white/70 text-[#3E4F65]",
            ].join(" ")}
          >
            {f === "todos" ? "Todos" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>
      <div className="mt-4 divide-y divide-[#E5DBC3] overflow-hidden rounded-2xl border border-[#E5DBC3] bg-white/70">
        {filtered.map((l) => (
          <div key={l.id} className="grid grid-cols-[1fr_auto] items-center gap-3 p-4">
            <div>
              <p className="font-semibold text-[#0B2A4A]">{l.nome}</p>
              <p className="text-xs text-[#8A7C5C]">
                {l.telefone}
                {l.diaDesafio ? ` · Dia ${l.diaDesafio}/7` : ""}
              </p>
            </div>
            <span className="rounded-full bg-[#EFE5CE] px-2.5 py-1 text-[11px] font-bold text-[#0B2A4A]">
              {STATUS_LABELS[l.status]}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-[#8A7C5C]">
            Nada por aqui com esse filtro.
          </div>
        )}
      </div>
    </div>
  );
}

function FilaView() {
  const [list, setList] = useState(() => getEscalations());
  const [resposta, setResposta] = useState<Record<string, string>>({});
  const pendentes = list.filter((e) => !e.respondido);
  function responder(id: string) {
    const texto = (resposta[id] || "").trim();
    if (!texto) return;
    const next = list.map((e) =>
      e.id === id ? { ...e, respondido: true, resposta: texto } : e,
    );
    setList(next);
    saveEscalations(next);
    setResposta((r) => ({ ...r, [id]: "" }));
  }
  return (
    <div className="mt-3 space-y-3">
      {pendentes.length === 0 && (
        <div className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-6 text-center text-sm text-[#8A7C5C]">
          Tudo em dia por aqui.
        </div>
      )}
      {pendentes.map((e) => (
        <div
          key={e.id}
          className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-[#0B2A4A]">{e.leadNome}</p>
              <p className="text-xs text-[#8A7C5C]">{e.leadTelefone}</p>
            </div>
            <span className="rounded-full bg-[#EFE5CE] px-2 py-0.5 text-[10px] font-bold text-[#0B2A4A]">
              Pendente
            </span>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#F7F2E8] p-3 text-sm">
            <MessageCircle className="mt-0.5 size-4 shrink-0 text-[#B8974D]" />
            <p>{e.pergunta}</p>
          </div>
          <textarea
            value={resposta[e.id] || ""}
            onChange={(ev) =>
              setResposta((r) => ({ ...r, [e.id]: ev.target.value }))
            }
            rows={3}
            placeholder="Responder como Gabriela"
            className="mt-3 w-full rounded-xl border border-[#E5DBC3] bg-white p-3 text-sm outline-none focus:border-[#B8974D]"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => responder(e.id)}
              disabled={!resposta[e.id]?.trim()}
              className="flex items-center gap-2 rounded-xl bg-[#0B2A4A] px-4 py-2 text-sm font-bold text-[#F7F2E8] disabled:opacity-40"
            >
              <Send className="size-4" /> Responder
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
