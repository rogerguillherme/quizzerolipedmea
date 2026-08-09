import { useCallback, useEffect, useRef, useState } from "react";
import { PREMIUM_FEATURES } from "@/lib/premium-features";


import { NAVY, GOLD, INK } from "@/lib/tokens";

const INTERVALO_MS = 4500;

/**
 * Carrossel dos entregáveis do Plano Premium.
 * Avança sozinho e para de vez assim que a pessoa interage (arrastar, clicar
 * numa bolinha ou rolar na horizontal). A partir daí ela controla o ritmo.
 * Respeita `prefers-reduced-motion`: sem autoplay e sem scroll suave.
 *
 * @param bleed  Quando true (padrão), o trilho sangra 20px para cada lado com
 *               `-mx-5`/`px-5`. Use apenas dentro de um container com `px-5`;
 *               passe `bleed={false}` em qualquer outro padding de página.
 */
export function PremiumFeaturesCarousel({ bleed = true }: { bleed?: boolean }) {
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

  // Autoplay: para de vez na primeira interação.
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
        aria-roledescription="carrossel"
        aria-label="Benefícios do Plano Zero Lipedema"
        className={`${bleed ? "-mx-5 px-5" : ""} flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {PREMIUM_FEATURES.map((f, i) => {
          return (
            <article
              key={f.id}
              aria-roledescription="slide"
              aria-label={`Benefício ${i + 1} de ${PREMIUM_FEATURES.length}: ${f.titulo}`}
              className="w-[84%] max-w-[330px] shrink-0 snap-center overflow-hidden rounded-[24px] border"
              style={{
                background: "rgba(255,253,247,0.97)",
                borderColor: "rgba(216,198,160,0.7)",
                boxShadow: "0 18px 36px -24px rgba(22,50,79,0.55)",
              }}
            >
              <div
                className="relative h-40 w-full overflow-hidden rounded-t-[24px]"
                style={{ background: "#F7EEDC", aspectRatio: "1000 / 477" }}
              >
                <img
                  src={f.foto}
                  alt={f.fotoAlt}
                  width={1000}
                  height={477}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full"
                  style={{ objectFit: "cover" }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(22,50,79,0.55), transparent 55%)",
                  }}
                />
                <span
                  className="absolute bottom-3 left-4 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-[0.14em]"
                  style={{ background: "rgba(22,50,79,0.45)", color: "#FBF6E9" }}
                >
                  {String(i + 1).padStart(2, "0")} / {String(PREMIUM_FEATURES.length).padStart(2, "0")}
                </span>
              </div>

              <div className="px-5 pb-5 pt-4">
                <h3
                  className="text-[20px] leading-snug"
                  style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: NAVY }}
                >
                  {f.titulo}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed" style={{ color: INK }}>
                  {f.descricao}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-1 flex items-center justify-center">
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
            // Visual de 6px, mas área de toque de 44px (WCAG 2.5.8).
            className="flex min-h-[44px] items-center justify-center bg-transparent"
            style={{ padding: "14px 6px" }}
          >
            <span
              aria-hidden
              className="block h-1.5 rounded-full transition-all"
              style={{
                width: i === ativo ? 20 : 6,
                background: i === ativo ? GOLD : "rgba(22,50,79,0.18)",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
