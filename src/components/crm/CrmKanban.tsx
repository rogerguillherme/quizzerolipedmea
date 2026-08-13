import { useState } from "react";
import { ETAPAS, type Etapa, haQuantoTempo, primeiroNome } from "@/lib/crm-labels";

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const BORDER = "rgba(216,198,160,0.6)";

export type CardConversa = {
  id: string;
  nome: string | null;
  telefone: string;
  ultima_mensagem: string | null;
  ultima_mensagem_em: string | null;
  nao_lidas: number;
  etapa: Etapa;
  temMapa: boolean;
};

export type CrmKanbanProps = {
  conversas: CardConversa[];
  onAbrir: (id: string) => void;
  onMover: (id: string, etapa: Etapa) => void;
};

export function CrmKanban({ conversas, onAbrir, onMover }: CrmKanbanProps) {
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [abaMobile, setAbaMobile] = useState<Etapa>("mapa_feito");

  const porEtapa = (e: Etapa) => conversas.filter((c) => c.etapa === e);

  const Card = ({ c }: { c: CardConversa }) => (
    <div
      draggable
      onDragStart={() => setArrastando(c.id)}
      onDragEnd={() => setArrastando(null)}
      className="rounded-2xl p-3"
      style={{
        background: "#FFFDF7",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 10px 22px -20px rgba(22,50,79,0.5)",
        opacity: arrastando === c.id ? 0.5 : 1,
      }}
    >
      <button
        onClick={() => onAbrir(c.id)}
        className="block w-full text-left"
      >
        <div className="flex items-center gap-1.5">
          {c.temMapa && (
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: GOLD }}
              title="Tem Mapa vinculado"
            />
          )}
          <p className="truncate text-sm font-bold" style={{ color: NAVY }}>
            {primeiroNome(c.nome, c.telefone)}
          </p>
          {c.nao_lidas > 0 && (
            <span
              className="ml-auto rounded-full px-1.5 text-[10px] font-bold text-white"
              style={{ background: "#E85D75" }}
            >
              {c.nao_lidas}
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-[12px] text-[#5C5749]">
          {c.ultima_mensagem || "Ainda sem mensagem"}
        </p>
        <p className="mt-1 text-[11px] text-[#8A7C5C]">
          {haQuantoTempo(c.ultima_mensagem_em)}
        </p>
      </button>

      <select
        value={c.etapa}
        onChange={(e) => onMover(c.id, e.target.value as Etapa)}
        className="mt-2 min-h-11 w-full rounded-xl px-2 text-[12px] md:hidden"
        style={{ border: `1px solid ${BORDER}`, color: NAVY, background: "#FFF" }}
      >
        {ETAPAS.map((e) => (
          <option key={e.id} value={e.id}>
            {e.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      {/* Mobile: abas horizontais, uma coluna por vez */}
      <div className="md:hidden">
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2">
          {ETAPAS.map((e) => {
            const n = porEtapa(e.id).length;
            const active = abaMobile === e.id;
            return (
              <button
                key={e.id}
                onClick={() => setAbaMobile(e.id)}
                className="min-h-11 shrink-0 rounded-full px-3 text-xs font-bold"
                style={{
                  background: active ? NAVY : "#FFFDF7",
                  color: active ? "#F7F2E8" : NAVY,
                  border: `1px solid ${BORDER}`,
                }}
              >
                {e.label} · {n}
              </button>
            );
          })}
        </div>
        <div className="space-y-2 pt-2">
          {porEtapa(abaMobile).map((c) => (
            <Card key={c.id} c={c} />
          ))}
          {porEtapa(abaMobile).length === 0 && (
            <p className="py-10 text-center text-[13px] text-[#8A7C5C]">
              Ninguém nesta etapa por enquanto.
            </p>
          )}
        </div>
      </div>

      {/* Desktop: quadro com arrastar e soltar */}
      <div className="hidden gap-3 overflow-x-auto md:flex">
        {ETAPAS.map((e) => {
          const lista = porEtapa(e.id);
          return (
            <div
              key={e.id}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => {
                if (arrastando) onMover(arrastando, e.id);
                setArrastando(null);
              }}
              className="flex w-[260px] shrink-0 flex-col rounded-2xl p-2"
              style={{ background: "rgba(239,229,206,0.5)", border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center justify-between px-1 py-1.5">
                <p
                  className="text-[11px] font-bold uppercase"
                  style={{ letterSpacing: "0.14em", color: NAVY }}
                >
                  {e.label}
                </p>
                <span
                  className="rounded-full px-2 text-[11px] font-bold"
                  style={{ background: NAVY, color: "#F7F2E8" }}
                >
                  {lista.length}
                </span>
              </div>
              <p className="px-1 pb-2 text-[10px] text-[#8A7C5C]">{e.dica}</p>
              <div className="flex-1 space-y-2">
                {lista.map((c) => (
                  <Card key={c.id} c={c} />
                ))}
                {lista.length === 0 && (
                  <p className="px-1 py-6 text-center text-[11px] text-[#8A7C5C]">
                    Ninguém aqui ainda.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
