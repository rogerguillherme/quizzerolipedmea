import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { ROTINA_SEMANAS } from "@/lib/rotina-content";
import { derivarPontosAtencao } from "@/lib/mapa-atencao";
import type { Diagnostico } from "@/lib/mapa.functions";
import {
  BORDER,
  CREAM,
  CREAM_SOFT,
  GOLD,
  GOLD_LABEL,
  GOLD_LIGHT,
  GRADIENT_GOLD,
  INK,
  INK_SOFT,
  NAVY,
  SHADOW,
} from "@/lib/tokens";

export interface MapaSheetProps {
  /** Leitura personalizada gerada no Mapa. */
  diagnostico: Diagnostico;
  /** Respostas do quiz, usadas para derivar os pontos de atenção. */
  respostas?: Record<string, unknown> | null;
  /** Define o destino do CTA primário do passo 3. */
  pago: boolean;
  /** Fecha o sheet (backdrop, Esc, arrastar para baixo, "Ver depois"). */
  onClose: () => void;
  /** Disparado uma única vez, ao chegar no passo 3. */
  onConcluir?: () => void;
}

const TOTAL_PASSOS = 3;

/** Detecta a preferência de movimento reduzido sem quebrar no SSR. */
function usePrefersReducedMotion(): boolean {
  const [reduzido, setReduzido] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduzido(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return reduzido;
}

/**
 * Bottom sheet com a leitura do Mapa do Lipedema em 3 passos.
 * Sobe de baixo, prende o foco, fecha no Esc, no backdrop e ao arrastar.
 */
export function MapaSheet({
  diagnostico,
  respostas,
  pago,
  onClose,
  onConcluir,
}: MapaSheetProps) {
  const [passo, setPasso] = useState(1);
  const [montado, setMontado] = useState(false);
  const [arraste, setArraste] = useState(0);
  const reduzido = usePrefersReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);
  const corpoRef = useRef<HTMLDivElement>(null);
  const inicioY = useRef<number | null>(null);
  const concluido = useRef(false);

  const chips = derivarPontosAtencao(respostas ?? null);
  const prioridades = (diagnostico.prioridades ?? []).slice(0, 3);

  // Animação de entrada em um frame após montar.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Marca como visto assim que ela chega ao último passo.
  useEffect(() => {
    if (passo === TOTAL_PASSOS && !concluido.current) {
      concluido.current = true;
      onConcluir?.();
    }
  }, [passo, onConcluir]);

  // Esc fecha e o foco fica preso dentro do sheet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !sheetRef.current) return;
      const focaveis = sheetRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0]!;
      const ultimo = focaveis[focaveis.length - 1]!;
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    sheetRef.current?.focus();
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onClose]);

  // Rola o conteúdo para o topo a cada passo.
  useEffect(() => {
    corpoRef.current?.scrollTo({ top: 0 });
  }, [passo]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if ((corpoRef.current?.scrollTop ?? 0) > 0) return;
    inicioY.current = e.touches[0]?.clientY ?? null;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (inicioY.current === null) return;
    const delta = (e.touches[0]?.clientY ?? 0) - inicioY.current;
    setArraste(delta > 0 ? delta : 0);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (arraste > 110) onClose();
    inicioY.current = null;
    setArraste(0);
  }, [arraste, onClose]);

  const transicao = reduzido ? "none" : "transform 280ms cubic-bezier(0.32,0.72,0,1)";
  const deslocamento = montado ? arraste : 640;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(22,50,79,0.55)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Seu Mapa do Lipedema"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="flex w-full max-w-md flex-col outline-none"
        style={{
          maxHeight: "88vh",
          background: passo === 1 ? NAVY : CREAM_SOFT,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          transform: `translateY(${deslocamento}px)`,
          transition: transicao,
          boxShadow: "0 -20px 50px -30px rgba(13,33,56,0.8)",
        }}
      >
        {/* Alça + indicadores */}
        <div className="shrink-0 px-5 pt-3">
          <div
            aria-hidden
            className="mx-auto h-1 w-11 rounded-full"
            style={{ background: passo === 1 ? "rgba(245,239,225,0.35)" : "rgba(22,50,79,0.18)" }}
          />
          <div className="mt-3 flex items-center gap-1.5" aria-hidden>
            {Array.from({ length: TOTAL_PASSOS }, (_, i) => (
              <span
                key={i}
                className="h-1 flex-1 rounded-full transition-colors duration-300"
                style={{
                  background:
                    i + 1 === passo
                      ? GOLD_LIGHT
                      : passo === 1
                      ? "rgba(245,239,225,0.22)"
                      : "rgba(22,50,79,0.12)",
                }}
              />
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            Passo {passo} de {TOTAL_PASSOS}
          </p>
        </div>

        {/* Conteúdo rolável */}
        <div ref={corpoRef} className="flex-1 overflow-y-auto px-5 pb-4 pt-5">
          {passo === 1 && (
            <div style={{ color: CREAM }}>
              <p
                className="text-[10px] font-semibold uppercase"
                style={{ letterSpacing: "0.24em", color: GOLD_LIGHT }}
              >
                Mapa do Lipedema
              </p>
              <h2
                className="mt-2.5 text-[1.5rem]"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, lineHeight: 1.25 }}
              >
                {diagnostico.aberturaValidadora}
              </h2>

              <div
                className="mt-5 rounded-[20px] px-4 py-4"
                style={{ background: "rgba(245,239,225,0.08)", border: "1px solid rgba(217,169,75,0.35)" }}
              >
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{ background: "rgba(217,169,75,0.18)", color: GOLD_LIGHT }}
                >
                  Estágio percebido: {diagnostico.estagio}
                </span>
                {diagnostico.descricaoEstagio && (
                  <p className="mt-3 text-[13px]" style={{ color: "rgba(245,239,225,0.88)", lineHeight: 1.6 }}>
                    {diagnostico.descricaoEstagio}
                  </p>
                )}
              </div>

              {chips.length > 0 && (
                <div className="mt-5">
                  <p
                    className="text-[10px] font-semibold uppercase"
                    style={{ letterSpacing: "0.24em", color: GOLD_LIGHT }}
                  >
                    Pontos de atenção
                  </p>
                  <ul className="mt-2.5 flex flex-wrap gap-2">
                    {chips.map((c) => (
                      <li
                        key={c}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px]"
                        style={{ background: CREAM, border: `1px solid ${GOLD}`, color: NAVY }}
                      >
                        <Sparkles className="size-3" style={{ color: GOLD_LABEL }} aria-hidden />
                        {c}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2.5 text-[11.5px]" style={{ color: "rgba(245,239,225,0.6)" }}>
                    Baseado no que você mesma relatou nas respostas.
                  </p>
                </div>
              )}
            </div>
          )}

          {passo === 2 && (
            <div>
              <p
                className="text-[10px] font-semibold uppercase"
                style={{ letterSpacing: "0.24em", color: GOLD_LABEL }}
              >
                Mapa do Lipedema
              </p>
              <h2
                className="mt-2 text-[1.4rem]"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: NAVY, lineHeight: 1.25 }}
              >
                O que dá para melhorar
              </h2>

              <ol className="mt-5 space-y-4">
                {prioridades.map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold"
                      style={{ background: "rgba(175,127,53,0.14)", color: GOLD_LABEL }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-[14px]" style={{ color: INK, lineHeight: 1.6 }}>
                      {p}
                    </p>
                  </li>
                ))}
              </ol>

              <p
                className="mt-6 rounded-[18px] px-4 py-3.5 text-[14px] font-semibold"
                style={{ background: "rgba(175,127,53,0.1)", border: `1px solid ${BORDER}`, color: NAVY }}
              >
                Repare que nenhuma delas é comer menos.
              </p>
            </div>
          )}

          {passo === 3 && (
            <div>
              <p
                className="text-[10px] font-semibold uppercase"
                style={{ letterSpacing: "0.24em", color: GOLD_LABEL }}
              >
                Mapa do Lipedema
              </p>
              <h2
                className="mt-2 text-[1.4rem]"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: NAVY, lineHeight: 1.25 }}
              >
                Não é dieta. É reeducação.
              </h2>

              <p className="mt-4 text-[14px] font-semibold" style={{ color: NAVY, lineHeight: 1.55 }}>
                Dieta restritiva é o caminho mais comum e o que menos funciona no lipedema.
              </p>
              <p className="mt-3 text-[13.5px]" style={{ color: INK, lineHeight: 1.65 }}>
                Cortar calorias emagrece o resto do corpo e deixa as pernas quase iguais. Pior:
                restrição aumenta inflamação, compulsão e cansaço — exatamente os três pontos que
                você quer diminuir.
              </p>
              <p className="mt-3 text-[13.5px]" style={{ color: INK, lineHeight: 1.65 }}>
                O que muda o seu quadro é reduzir a carga inflamatória e reconstruir a rotina
                alimentar aos poucos. Uma refeição por semana. Sem contar caloria, sem pesar comida,
                sem passar fome.
              </p>
              <p className="mt-3 text-[13.5px]" style={{ color: INK, lineHeight: 1.65 }}>
                Em 4 semanas suas 4 refeições principais estão ajustadas — e aí não é mais esforço,
                é rotina.
              </p>

              <div className="mt-5 grid grid-cols-4 gap-2">
                {ROTINA_SEMANAS.map((s) => (
                  <div
                    key={s.numero}
                    className="rounded-[14px] px-2 py-2.5 text-center"
                    style={{ background: "rgba(255,253,247,0.95)", border: `1px solid ${BORDER}` }}
                  >
                    <p
                      className="text-[9.5px] font-semibold uppercase"
                      style={{ letterSpacing: "0.14em", color: GOLD_LABEL }}
                    >
                      Sem {s.numero}
                    </p>
                    <p className="mt-0.5 text-[11.5px] font-semibold" style={{ color: NAVY }}>
                      {s.refeicao.split(" ")[0]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé fixo */}
        <div
          className="shrink-0 px-5 pb-5 pt-3"
          style={{
            borderTop:
              passo === 1 ? "1px solid rgba(245,239,225,0.14)" : `1px solid ${BORDER}`,
          }}
        >
          {passo < TOTAL_PASSOS ? (
            <button
              type="button"
              onClick={() => setPasso((p) => Math.min(TOTAL_PASSOS, p + 1))}
              className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-[14px] font-semibold uppercase"
              style={{ background: GRADIENT_GOLD, color: NAVY, letterSpacing: "0.14em", boxShadow: SHADOW.gold }}
            >
              Continuar <ArrowRight className="size-4" />
            </button>
          ) : (
            <Link
              to={pago ? "/app/rotina" : "/app/derma"}
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-[14px] font-semibold uppercase"
              style={{ background: GRADIENT_GOLD, color: NAVY, letterSpacing: "0.14em", boxShadow: SHADOW.gold }}
            >
              {pago ? "Começar a Semana 1" : "Ver como funciona"} <ArrowRight className="size-4" />
            </Link>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full py-2 text-[12.5px]"
            style={{ color: passo === 1 ? "rgba(245,239,225,0.7)" : INK_SOFT }}
          >
            Ver depois
          </button>

          <p
            className="mt-1 text-center text-[10.5px]"
            style={{ color: passo === 1 ? "rgba(245,239,225,0.5)" : INK_SOFT, lineHeight: 1.5 }}
          >
            Leitura educacional baseada nas suas respostas. Não substitui avaliação médica.
          </p>
        </div>
      </div>
    </div>
  );
}
