import { useCallback, useEffect, useRef, useState } from "react";
import { PREMIUM_FEATURES } from "@/lib/premium-features";


const NAVY = "#16324F";
const GOLD = "#AF7F35";

const INTERVALO_MS = 4500;

/**
 * Carrossel dos entregáveis do Plano Premium.
 * Avança sozinho e para de vez assim que a pessoa interage (arrastar, clicar
 * numa bolinha ou rolar na horizontal) — a partir daí ela controla o ritmo.
 * Respeita `prefers-reduced-motion`: sem autoplay e sem scroll suave.
 */
export function PremiumFeaturesCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(0);
  const [pausado, setPausado] = useState(false);
  const ativoRef = useRef(0);
  ativoRef.current = ativo;

  const reduzMovimento =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const irPara = useCallback(
    (i: number, suave = true) => {
      const track = trackRef.current;
      const card = track?.children[i] as HTMLElement | undefined;
      if (!track || !card) return;
      track.scrollTo({
        left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2,
        behavior: suave && !reduzMovimento ? "smooth" : "auto",
      });
    },
    [reduzMovimento],
  );

  // Autoplay — para de vez na primeira interação.
  useEffect(() => {
    if (pausado || reduzMovimento) return;
    const id = window.setInterval(() => {
      irPara((ativoRef.current + 1) % PREMIUM_FEATURES.length);
    }, INTERVALO_MS);
    return () => window.clearInterval(id);
  }, [pausado, irPara, reduzMovimento]);

  // Descobre o card em foco a partir da posição do scroll.
  const aoRolar = () => {
    const track = trackRef.current;
    if (!track) return;
    const centro = track.scrollLeft + track.clientWidth / 2;
    let maisProximo = 0;
    let menorDist = Infinity;
    Array.from(track.children).forEach((filho, i) => {
      const el = filho as HTMLElement;
      const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - centro);
      if (d < menorDist) {
        menorDist = d;
        maisProximo = i;
      }
    });
    setAtivo(maisProximo);
  };

  return (
    <div className="select-none">
      <div
        ref={trackRef}
        onScroll={aoRolar}
        onPointerDown={() => setPausado(true)}
        onTouchStart={() => setPausado(true)}
        onWheel={() => setPausado(true)}
        className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PREMIUM_FEATURES.map((f, i) => {
          const Ilustra = PREMIUM_ILLUSTRATIONS[f.id];
          const Icone = f.icone;
          return (
            <article
              key={f.id}
              className="w-[84%] max-w-[330px] shrink-0 snap-center overflow-hidden rounded-3xl border"
              style={{
                background: "rgba(255,253,247,0.97)",
                borderColor: "rgba(216,198,160,0.7)",
                boxShadow: "0 18px 36px -24px rgba(22,50,79,0.55)",
              }}
            >
              <div
                className="relative grid h-40 place-items-center px-4"
                style={{ background: "linear-gradient(160deg, #F7EEDC 0%, #EFE3CC 100%)" }}
              >
                <span
                  className="absolute left-4 top-4 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.14em]"
                  style={{ background: "rgba(22,50,79,0.08)", color: NAVY }}
                >
                  {String(i + 1).padStart(2, "0")} / {String(PREMIUM_FEATURES.length).padStart(2, "0")}
                </span>
                {Ilustra ? <Ilustra className="h-full w-full" /> : <Icone className="size-10" style={{ color: NAVY }} />}
              </div>
              <div className="px-5 pb-5 pt-4">
                <h3
                  className="text-[19px] leading-snug"
                  style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: NAVY }}
                >
                  {f.titulo}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "#4A4635" }}>
                  {f.descricao}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {PREMIUM_FEATURES.map((f, i) => (
          <button
            key={f.id}
            type="button"
            aria-label={`Ver ${f.titulo}`}
            aria-current={i === ativo || undefined}
            onClick={() => {
              setPausado(true);
              irPara(i);
            }}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === ativo ? 20 : 6,
              background: i === ativo ? GOLD : "rgba(22,50,79,0.18)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
