import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  X,
  ArrowRight,
  ShoppingBasket,
  PartyPopper,
  PlayCircle,
  Copy,
  Check,
  TrendingUp,
} from "lucide-react";
import { getApp, setApp, type Jornada7 } from "@/lib/quiz-store";
import { track } from "@/lib/analytics";
import {
  CARDAPIOS,
  CHA_INDICADO,
  listaDeCompras,
  REFEICOES,
  REGIOES,
  RESTRICOES,
  type Refeicao,
  type Regiao,
  type Restricao,
} from "@/lib/protocolo7";
import {
  iniciarProtocolo7,
  registrarFeedbackDia,
} from "@/lib/protocolo7.functions";

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const CREAM = "#F5EFE1";

/**
 * Tela completa do Protocolo de 7 Dias.
 * - Card escuro com estado ativo (grid de dias) ou CTA para iniciar.
 * - Dialogs: iniciar (4 passos) e finale (dia 7).
 */
export function Protocolo7Screen() {
  const app = getApp();
  const [jornada, setJornada] = useState<Jornada7>(app.jornada7 || {});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [finaleOpen, setFinaleOpen] = useState(false);
  const [listaOpen, setListaOpen] = useState(false);
  const [progressoOpen, setProgressoOpen] = useState(false);

  const diasCumpridos = useMemo(() => {
    const fb = jornada.feedbackDias || {};
    return Object.values(fb).filter((v) => v === "sim" || v === "parcial").length;
  }, [jornada]);

  const pctProtocolo = Math.round((diasCumpridos / 7) * 100);
  const protocoloAtivo = !!jornada.ativa;

  function onProtocoloIniciado(j: Jornada7) {
    setJornada(j);
    setApp({ jornada7: j });
    setDialogOpen(false);
    track("protocol7_started", { regiao: j.regiao, refeicao: j.refeicao });
  }

  const registrarFeedback = useServerFn(registrarFeedbackDia);

  async function marcarDia(diaN: number, resposta: "sim" | "parcial" | "nao") {
    const fb = { ...(jornada.feedbackDias || {}), [diaN]: resposta };
    const next = { ...jornada, feedbackDias: fb };
    setJornada(next);
    setApp({ jornada7: next });
    try {
      await registrarFeedback({ data: { dia: diaN, resposta } });
    } catch {
      /* silencioso — sem cobrança */
    }
    const cumpridos = Object.values(fb).filter((v) => v === "sim" || v === "parcial").length;
    if (cumpridos >= 7) {
      track("protocol7_completed");
      setFinaleOpen(true);
    }
  }

  return (
    <div className="px-5 pt-6 pb-24">
      <p
        className="text-[10px] font-semibold uppercase"
        style={{ letterSpacing: "0.24em", color: GOLD }}
      >
        Protocolo gratuito
      </p>
      <h1
        className="mt-2"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 500,
          fontSize: "1.75rem",
          lineHeight: 1.15,
          color: NAVY,
        }}
      >
        <em className="italic" style={{ color: GOLD }}>7 dias</em> para começar a cuidar
      </h1>
      <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "#2F3128" }}>
        Uma cadência simples: você troca 1 refeição, recebe a lista de compras e dicas diárias no WhatsApp. Sem cobrança durante os 7 dias.
      </p>

      <div
        className="mt-5 overflow-hidden rounded-2xl p-5"
        style={{
          background: "linear-gradient(160deg, #16324F 0%, #1E4368 100%)",
          color: CREAM,
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="size-4" style={{ color: "#D9A94B" }} />
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#D9A94B" }}>
            {protocoloAtivo ? "Em andamento" : "Comece agora"}
          </p>
        </div>
        <p
          className="mt-2"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", lineHeight: 1.2 }}
        >
          {protocoloAtivo ? "Seu Protocolo de 7 Dias" : "Ative seu Protocolo de 7 Dias"}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "rgba(245,239,225,0.85)" }}>
          {protocoloAtivo
            ? "Sua cadência está ativa. Marque como foi o dia — sem cobrança."
            : "Responda 4 perguntas rápidas e receba tudo pelo WhatsApp."}
        </p>

        {protocoloAtivo && (
          <>
            <div className="mt-4 flex items-center justify-between text-[12px]">
              <span style={{ color: "rgba(245,239,225,0.85)" }}>Dias cumpridos</span>
              <span className="font-bold tabular-nums" style={{ color: "#D9A94B" }}>
                {diasCumpridos}/7
              </span>
            </div>
            <div
              className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: "rgba(245,239,225,0.15)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pctProtocolo}%`,
                  background: "linear-gradient(90deg, #D9A94B, #F5EFE1)",
                }}
              />
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => {
                const fb = jornada.feedbackDias?.[d];
                const ok = fb === "sim" || fb === "parcial";
                return (
                  <button
                    key={d}
                    onClick={() => marcarDia(d, ok ? "nao" : "sim")}
                    className="rounded-lg py-2 text-[11px] font-bold transition"
                    style={{
                      background: ok ? "#D9A94B" : "rgba(245,239,225,0.1)",
                      color: ok ? NAVY : CREAM,
                      border: "1px solid rgba(245,239,225,0.25)",
                    }}
                    aria-label={`Marcar dia ${d}`}
                  >
                    D{d}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "rgba(245,239,225,0.7)" }}>
              Sem responder é ok. A barra segue no ritmo do que você marcar aqui ou no WhatsApp.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setListaOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12.5px] font-semibold transition active:scale-[0.98]"
                style={{
                  background: "rgba(245,239,225,0.12)",
                  color: CREAM,
                  border: "1px solid rgba(245,239,225,0.25)",
                }}
              >
                <ShoppingBasket className="size-3.5" />
                Lista de compras
              </button>
              <button
                onClick={() => setProgressoOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12.5px] font-semibold transition active:scale-[0.98]"
                style={{
                  background: "rgba(245,239,225,0.12)",
                  color: CREAM,
                  border: "1px solid rgba(245,239,225,0.25)",
                }}
              >
                <TrendingUp className="size-3.5" />
                Progresso
              </button>
            </div>
          </>)}

        {!protocoloAtivo && (
          <button
            onClick={() => setDialogOpen(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-semibold transition active:scale-[0.98]"
            style={{
              background: "linear-gradient(180deg, #D9A94B, #AF7F35)",
              color: NAVY,
              boxShadow: "0 10px 24px -12px rgba(217,169,75,0.6)",
            }}
          >
            Iniciar Protocolo de 7 Dias
            <ArrowRight className="size-4" />
          </button>
        )}

        {protocoloAtivo && diasCumpridos >= 7 && (
          <button
            onClick={() => setFinaleOpen(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-semibold"
            style={{ background: CREAM, color: NAVY }}
          >
            <PartyPopper className="size-4" />
            Ver relatório e próximo passo
          </button>
        )}
      </div>

      {protocoloAtivo && (
        <button
          onClick={() => setDialogOpen(true)}
          className="mt-3 w-full rounded-xl py-2.5 text-[12.5px] font-semibold"
          style={{
            background: "rgba(255,253,247,0.9)",
            border: "1px solid rgba(216,198,160,0.55)",
            color: NAVY,
          }}
        >
          Refazer configuração do protocolo
        </button>
      )}

      <p className="mt-6 text-center text-[11px] leading-relaxed" style={{ color: "#2F3128" }}>
        Conteúdo educacional. Nutricionista (CRN) não prescreve medicamento nem
        exercício estruturado.
      </p>

      {dialogOpen && (
        <ProtocoloDialog
          onClose={() => setDialogOpen(false)}
          onFinish={onProtocoloIniciado}
        />
      )}
      {finaleOpen && <FinaleDialog onClose={() => setFinaleOpen(false)} />}
      {listaOpen && (
        <ListaComprasDialog
          lista={jornada.listaCompras || []}
          opcaoTitulo={jornada.opcaoTitulo}
          onClose={() => setListaOpen(false)}
        />
      )}
      {progressoOpen && (
        <ProgressoDialog
          jornada={jornada}
          diasCumpridos={diasCumpridos}
          onClose={() => setProgressoOpen(false)}
        />
      )}
    </div>
  );
}

// -------------------------- Dialog: iniciar protocolo --------------------------

export function ProtocoloDialog({
  onClose,
  onFinish,
}: {
  onClose: () => void;
  onFinish: (j: Jornada7) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [regiao, setRegiao] = useState<Regiao | null>(null);
  const restricao: Restricao = "ambas";
  const [refeicao, setRefeicao] = useState<Refeicao | null>(null);
  const [opcaoId, setOpcaoId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const iniciar = useServerFn(iniciarProtocolo7);

  const opcoes = regiao && refeicao ? CARDAPIOS[regiao][refeicao] : [];
  const opcao = opcoes.find((o) => o.id === opcaoId) || null;
  const lista =
    opcao ? listaDeCompras(opcao.ingredientes, restricao) : [];


  async function confirmar() {
    if (!regiao || !refeicao || !opcao) return;

    setEnviando(true);
    const jornada: Jornada7 = {
      ativa: true,
      iniciadoEm: new Date().toISOString(),
      regiao,
      restricao,
      refeicao,
      opcaoId: opcao.id,
      opcaoTitulo: opcao.titulo,
      ingredientes: opcao.ingredientes,
      listaCompras: lista,
      feedbackDias: {},
    };
    try {
      await iniciar({
        data: {
          regiao,
          restricao,
          refeicao,
          opcaoTitulo: opcao.titulo,
          listaCompras: lista,
        },
      });
    } catch {
      /* segue mesmo sem WhatsApp — não bloqueia a jornada local */
    }
    setEnviando(false);
    onFinish(jornada);
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ background: "rgba(15,30,50,0.55)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl p-5"
        style={{ background: "#FDFBF5" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
            Protocolo 7 Dias · Passo {step}/4
          </p>
          <button onClick={onClose} aria-label="Fechar">
            <X className="size-5" style={{ color: NAVY }} />
          </button>
        </div>

        {step === 1 && (
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: NAVY }}>
              Em qual região você mora?
            </h3>
            <p className="mt-1 text-[12.5px]" style={{ color: "#2F3128" }}>
              Vamos adaptar o cardápio aos alimentos típicos da sua região.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {REGIOES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRegiao(r.id)}
                  className="rounded-xl px-3 py-3 text-left text-[13.5px] font-medium transition"
                  style={{
                    background: regiao === r.id ? NAVY : "rgba(255,253,247,0.9)",
                    color: regiao === r.id ? CREAM : NAVY,
                    border: "1px solid rgba(216,198,160,0.55)",
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[11.5px] leading-relaxed" style={{ color: "#5C5749" }}>
              Todas as opções já são naturalmente sem glúten e sem lactose.
            </p>
            <button
              disabled={!regiao}
              onClick={() => setStep(2)}
              className="mt-4 w-full rounded-xl py-3 text-[14px] font-semibold transition disabled:opacity-40"
              style={{ background: NAVY, color: CREAM }}
            >
              Continuar
            </button>
          </div>
        )}


        {step === 2 && (
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: NAVY }}>
              Qual refeição você quer substituir?
            </h3>
            <p className="mt-1 text-[12.5px]" style={{ color: "#2F3128" }}>
              Escolha uma — vamos montar as opções e a lista pra ela.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {REFEICOES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRefeicao(r.id)}
                  className="rounded-xl px-3 py-4 text-[13px] font-semibold transition"
                  style={{
                    background: refeicao === r.id ? NAVY : "rgba(255,253,247,0.9)",
                    color: refeicao === r.id ? CREAM : NAVY,
                    border: "1px solid rgba(216,198,160,0.55)",
                  }}
                >
                  <span className="block text-2xl">{r.emoji}</span>
                  <span className="mt-1 block">{r.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl py-3 text-[13px] font-semibold"
                style={{ background: "rgba(22,50,79,0.08)", color: NAVY }}
              >
                Voltar
              </button>
              <button
                disabled={!refeicao}
                onClick={() => setStep(3)}
                className="flex-[2] rounded-xl py-3 text-[14px] font-semibold transition disabled:opacity-40"
                style={{ background: NAVY, color: CREAM }}
              >
                Ver opções
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: NAVY }}>
              3 opções para {REFEICOES.find((r) => r.id === refeicao)?.label.toLowerCase()}
            </h3>
            <p className="mt-1 text-[12.5px]" style={{ color: "#2F3128" }}>
              Baseadas no cardápio validado da sua região.
            </p>
            <div className="mt-3 space-y-2">
              {opcoes.map((o) => {
                const sel = opcaoId === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setOpcaoId(o.id)}
                    className="w-full rounded-xl p-3 text-left transition"
                    style={{
                      background: sel ? "rgba(217,169,75,0.15)" : "rgba(255,253,247,0.9)",
                      border: `1px solid ${sel ? GOLD : "rgba(216,198,160,0.55)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-[13.5px] font-semibold" style={{ color: NAVY }}>
                        {o.titulo}
                      </p>
                      {sel && <CheckCircle2 className="size-4" style={{ color: GOLD }} />}
                    </div>
                    <p className="mt-1 text-[12px]" style={{ color: "#2F3128" }}>
                      {o.descricao}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl py-3 text-[13px] font-semibold"
                style={{ background: "rgba(22,50,79,0.08)", color: NAVY }}
              >
                Voltar
              </button>
              <button
                disabled={!opcaoId}
                onClick={() => setStep(4)}
                className="flex-[2] rounded-xl py-3 text-[14px] font-semibold transition disabled:opacity-40"
                style={{ background: NAVY, color: CREAM }}
              >
                Ver lista de compras
              </button>
            </div>
          </div>
        )}

        {step === 4 && opcao && (
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBasket className="size-4" style={{ color: GOLD }} />
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: NAVY }}>
                Sua lista de compras
              </h3>
            </div>
            <p className="mt-1 text-[12.5px]" style={{ color: "#2F3128" }}>
              Para <strong>{opcao.titulo}</strong> + despensa base + chá de gengibre.
            </p>
            <ul className="mt-3 grid grid-cols-1 gap-1.5">
              {lista.map((i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px]"
                  style={{ background: "rgba(22,50,79,0.04)", color: NAVY }}
                >
                  <Circle className="size-3" style={{ color: GOLD }} />
                  {i}
                </li>
              ))}
            </ul>
            <div
              className="mt-4 rounded-xl p-3 text-[12px] leading-relaxed"
              style={{ background: "rgba(217,169,75,0.1)", color: NAVY }}
            >
              Ao confirmar, você recebe a lista pelo WhatsApp e a cadência começa hoje.
              Nos próximos 7 dias, dicas diárias + 2 receitas em dois dias da semana.
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-xl py-3 text-[13px] font-semibold"
                style={{ background: "rgba(22,50,79,0.08)", color: NAVY }}
              >
                Voltar
              </button>
              <button
                disabled={enviando}
                onClick={confirmar}
                className="flex-[2] rounded-xl py-3 text-[14px] font-semibold transition disabled:opacity-60"
                style={{ background: "linear-gradient(180deg, #D9A94B, #AF7F35)", color: NAVY }}
              >
                {enviando ? "Enviando…" : "Ativar protocolo"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------- Dialog: encerramento dia 7 --------------------------

export function FinaleDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ background: "rgba(15,30,50,0.6)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl"

        style={{ background: "#FDFBF5" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
            Você chegou ao dia 7 🎉
          </p>
          <button onClick={onClose} aria-label="Fechar">
            <X className="size-5" style={{ color: NAVY }} />
          </button>
        </div>
        <div className="px-5">
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", color: NAVY, lineHeight: 1.15 }}>
            Parabéns por concluir seu Protocolo de 7 Dias
          </h3>
          <div
            className="mt-3 aspect-video overflow-hidden rounded-2xl"
            style={{ background: "linear-gradient(160deg, #16324F, #1E4368)", display: "grid", placeItems: "center" }}
          >
            <div className="flex flex-col items-center text-center" style={{ color: CREAM }}>
              <PlayCircle className="size-12" style={{ color: "#D9A94B" }} />
              <p className="mt-2 text-[12px] uppercase tracking-widest" style={{ color: "#D9A94B" }}>
                Mensagem da Dra. Gabriela
              </p>
              <p className="mt-1 text-[13px]" style={{ color: "rgba(245,239,225,0.85)" }}>
                (vídeo em breve nesta tela)
              </p>
            </div>
          </div>

          <div
            className="mt-4 rounded-2xl p-4"
            style={{ background: "rgba(217,169,75,0.1)", border: "1px solid rgba(175,127,53,0.35)" }}
          >
            <p className="text-[12px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              Seu progresso
            </p>
            <ul className="mt-2 space-y-1 text-[13px]" style={{ color: NAVY }}>
              <li>• Você seguiu 7 dias de troca de refeição.</li>
              <li>• Introduziu o chá indicado com a contraindicação respeitada.</li>
              <li>• Recebeu 2 receitas práticas na semana.</li>
              <li>• Marcou seus dias sem cobrança.</li>
            </ul>
          </div>

          <div
            className="mt-4 rounded-2xl p-4"
            style={{ background: "linear-gradient(160deg, #16324F 0%, #1E4368 100%)", color: CREAM }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#D9A94B" }}>
              Próximo passo
            </p>
            <p className="mt-2" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", lineHeight: 1.2 }}>
              Método Derma — 90 dias de acompanhamento completo
            </p>
            <p className="mt-2 text-[13px]" style={{ color: "rgba(245,239,225,0.85)" }}>
              Cardápios personalizados por fase, acompanhamento próximo da Dra. Gabriela
              e o protocolo completo que ela usa com as pacientes do consultório.
            </p>
            <a
              href="/app/derma"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-semibold"
              style={{ background: "linear-gradient(180deg, #D9A94B, #AF7F35)", color: NAVY }}
              onClick={() => track("derma_cta_click", { origem: "protocolo7_finale" })}
            >
              Quero conhecer o Método Derma
              <ArrowRight className="size-4" />
            </a>
          </div>

          <p className="mt-4 pb-5 text-center text-[11px]" style={{ color: "#5C5749" }}>
            Este é o único momento de cobrança do protocolo. Nada antes disso.
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------- Dialog: lista de compras --------------------------

export function ListaComprasDialog({
  lista,
  opcaoTitulo,
  onClose,
}: {
  lista: string[];
  opcaoTitulo?: string;
  onClose: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const texto =
      (opcaoTitulo ? `Lista de compras — ${opcaoTitulo}\n\n` : "Lista de compras\n\n") +
      lista.map((i) => `• ${i}`).join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* silencioso */
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ background: "rgba(15,30,50,0.55)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl p-5"
        style={{ background: "#FDFBF5" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBasket className="size-4" style={{ color: GOLD }} />
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
              Lista de compras
            </p>
          </div>
          <button onClick={onClose} aria-label="Fechar">
            <X className="size-5" style={{ color: NAVY }} />
          </button>
        </div>

        {opcaoTitulo && (
          <p className="text-[13px]" style={{ color: "#2F3128" }}>
            Para <strong>{opcaoTitulo}</strong>.
          </p>
        )}

        {lista.length === 0 ? (
          <p className="mt-4 text-[13px]" style={{ color: "#5C5749" }}>
            Sua lista aparece aqui depois de configurar o protocolo.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-1.5">
            {lista.map((i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px]"
                style={{ background: "rgba(22,50,79,0.04)", color: NAVY }}
              >
                <Circle className="size-3" style={{ color: GOLD }} />
                {i}
              </li>
            ))}
          </ul>
        )}

        <button
          disabled={lista.length === 0}
          onClick={copiar}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold transition disabled:opacity-40"
          style={{
            background: copiado ? CREAM : "linear-gradient(180deg, #D9A94B, #AF7F35)",
            color: NAVY,
            border: copiado ? `1px solid ${GOLD}` : "none",
          }}
        >
          {copiado ? (
            <>
              <Check className="size-4" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="size-4" />
              Copiar lista
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// -------------------------- Dialog: progresso --------------------------

export function ProgressoDialog({
  jornada,
  diasCumpridos,
  onClose,
}: {
  jornada: Jornada7;
  diasCumpridos: number;
  onClose: () => void;
}) {
  const fb = jornada.feedbackDias || {};
  const dias = Array.from({ length: 7 }, (_, i) => i + 1);
  const sim = dias.filter((d) => fb[d] === "sim").length;
  const parcial = dias.filter((d) => fb[d] === "parcial").length;
  const nao = dias.filter((d) => fb[d] === "nao").length;
  const semResposta = 7 - sim - parcial - nao;
  const pct = Math.round((diasCumpridos / 7) * 100);

  const mensagem =
    diasCumpridos === 0
      ? "Você ainda está começando. Marque um dia sempre que conseguir — sem cobrança."
      : diasCumpridos < 3
      ? "Bom início. A constância importa mais que a perfeição."
      : diasCumpridos < 5
      ? "Você já criou ritmo. Continue no seu tempo."
      : diasCumpridos < 7
      ? "Excelente evolução. Faltam poucos dias para fechar o ciclo."
      : "Ciclo completo. Parabéns por chegar até aqui.";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ background: "rgba(15,30,50,0.55)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl p-5"
        style={{ background: "#FDFBF5" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4" style={{ color: GOLD }} />
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
              Seu progresso
            </p>
          </div>
          <button onClick={onClose} aria-label="Fechar">
            <X className="size-5" style={{ color: NAVY }} />
          </button>
        </div>

        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: NAVY, lineHeight: 1.2 }}>
          {diasCumpridos}/7 dias cumpridos
        </h3>
        <p className="mt-1 text-[13px]" style={{ color: "#2F3128" }}>
          {mensagem}
        </p>

        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(22,50,79,0.08)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, #D9A94B, #AF7F35)" }}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <StatCard label="Cumpri" valor={sim} cor="#2F7A47" />
          <StatCard label="Parcial" valor={parcial} cor={GOLD} />
          <StatCard label="Não cumpri" valor={nao} cor="#A85C3B" />
          <StatCard label="Sem marcar" valor={semResposta} cor="#5C5749" />
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
            Linha do tempo
          </p>
          <div className="mt-2 space-y-1.5">
            {dias.map((d) => {
              const r = fb[d];
              const label =
                r === "sim" ? "Cumpri" : r === "parcial" ? "Parcial" : r === "nao" ? "Não cumpri" : "Sem marcar";
              const cor =
                r === "sim" ? "#2F7A47" : r === "parcial" ? GOLD : r === "nao" ? "#A85C3B" : "#B8B3A3";
              return (
                <div
                  key={d}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px]"
                  style={{ background: "rgba(22,50,79,0.04)", color: NAVY }}
                >
                  <span className="font-semibold">Dia {d}</span>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ background: cor }}
                    />
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl py-3 text-[14px] font-semibold"
          style={{ background: NAVY, color: CREAM }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "rgba(22,50,79,0.04)", border: "1px solid rgba(216,198,160,0.4)" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#5C5749" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: cor, fontFamily: "'Playfair Display', serif" }}>
        {valor}
      </p>
    </div>
  );
}
