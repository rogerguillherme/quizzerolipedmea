import { useEffect, useRef } from "react";
import {
  Sparkles,
  ChevronRight,
  Play,
  ShieldCheck,
} from "lucide-react";
import { track } from "@/lib/analytics";
import { trackMeta } from "@/lib/meta-track";
import { PremiumFeaturesCarousel } from "@/components/PremiumFeaturesCarousel";

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const CREAM_SOFT = "#FBF6E9";

export const KIWIFY_CHECKOUT_URL = "https://pay.kiwify.com.br/j0hsxv3";




export interface OfertaPremiumInlineProps {
  /** Primeiro nome da lead, usado só no texto de abertura. */
  nome?: string;
  /** Origem do evento de tracking (ex.: "mapa_resultado" | "mapa_chat"). */
  origem?: string;
  className?: string;
}

/**
 * Oferta do Plano Premium (R$67) exibida logo abaixo do resultado do Mapa.
 * Substitui a barreira de "criar conta antes de ver a oferta": a lead vê VSL +
 * oferta e vai direto ao checkout da Kiwify. A conta é criada no webhook após o pagamento.
 */
export function OfertaPremiumInline({
  nome,
  origem = "mapa_resultado",
  className,
}: OfertaPremiumInlineProps) {
  const jaDisparou = useRef(false);

  useEffect(() => {
    if (jaDisparou.current) return;
    jaDisparou.current = true;
    track("checkout_view", { origem, plano: "premium_67" });
    trackMeta("ViewContent", {
      content_name: "Plano Premium Zero Lipedema 30d",
      content_type: "product",
      value: 67,
      currency: "BRL",
      origem,
    });
  }, [origem]);

  const primeiroNome = (nome || "").trim().split(/\s+/)[0];

  function handleCheckout() {
    track("premium_upgrade_clicked", { origem, valor: 67 });
    trackMeta("InitiateCheckout", {
      content_name: "Plano Premium Zero Lipedema 30d",
      content_type: "product",
      value: 67,
      currency: "BRL",
      origem,
    });
  }

  return (
    <section className={className}>
      {/* ---------- VSL da Gabriela ---------- */}
      <div className="mt-6">
        <p
          className="text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.24em", color: GOLD }}
        >
          Assista antes de continuar
        </p>
        <h2
          className="mt-1.5 text-[1.15rem] leading-snug"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, color: NAVY }}
        >
          {primeiroNome
            ? `${primeiroNome}, o que fazer a partir do seu Mapa`
            : "O que fazer a partir do seu Mapa"}
        </h2>

        {/*
          VSL: para publicar o vídeo, substitua TODO o conteúdo interno deste
          container 16:9 por um dos exemplos abaixo (o wrapper já é responsivo):

          <iframe
            src="https://www.youtube.com/embed/VIDEO_ID"
            title="Vídeo da Gabriela"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full"
          />

          ou

          <video src="/vsl-gabriela.mp4" controls playsInline className="absolute inset-0 size-full object-cover" />
        */}
        <div
          className="relative mt-3 w-full overflow-hidden rounded-2xl border"
          style={{
            aspectRatio: "16 / 9",
            borderColor: "rgba(216,198,160,0.7)",
            background: `linear-gradient(160deg, ${NAVY} 0%, #0E2439 100%)`,
            boxShadow: "0 18px 36px -22px rgba(22,50,79,0.6)",
          }}
        >
          <div
            aria-hidden
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-25"
            style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }}
          />
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div>
              <span
                className="mx-auto grid size-14 place-items-center rounded-full"
                style={{
                  background: `linear-gradient(180deg, #E7BE5C, ${GOLD})`,
                  color: NAVY,
                  boxShadow: "0 10px 22px -10px rgba(175,127,53,0.8)",
                }}
              >
                <Play className="size-6 translate-x-[1px]" fill="currentColor" />
              </span>
              <p
                className="mt-3 text-[13px] leading-snug"
                style={{ color: CREAM_SOFT, fontFamily: "'Fraunces', serif" }}
              >
                Vídeo da Gabriela Rosado
              </p>
              <p className="mt-1 text-[11px]" style={{ color: "rgba(251,246,233,0.65)" }}>
                Em breve neste espaço
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Oferta R$67 ---------- */}
      <div className="mt-6 space-y-2.5">
        <p
          className="text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.22em", color: GOLD }}
        >
          Plano Premium · 30 dias · o que está incluso
        </p>

        {FEATURES.map((f) => {
          const Icon = f.icone;
          return (
            <article
              key={f.titulo}
              className="flex gap-3 rounded-2xl border p-3.5"
              style={{
                background: "rgba(255,253,247,0.9)",
                borderColor: "rgba(216,198,160,0.55)",
              }}
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-full"
                style={{
                  background: "linear-gradient(180deg, #EFE3CC, #F5EFE1)",
                  color: NAVY,
                  border: "1px solid rgba(175,127,53,0.35)",
                }}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <h3
                  className="text-[14px] leading-snug"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontWeight: 500,
                    color: NAVY,
                  }}
                >
                  {f.titulo}
                </h3>
                <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: "#4A4635" }}>
                  {f.descricao}
                </p>
              </div>

            </article>
          );
        })}
      </div>

      <div
        className="mt-5 overflow-hidden rounded-3xl px-5 py-6"
        style={{
          background: `linear-gradient(160deg, ${NAVY} 0%, #0E2439 100%)`,
          color: CREAM_SOFT,
          boxShadow: "0 20px 40px -20px rgba(22,50,79,0.55)",
        }}
      >
        <div
          className="rounded-2xl px-4 py-4"
          style={{
            background: "rgba(255,253,247,0.08)",
            border: "1px solid rgba(216,198,160,0.35)",
          }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs opacity-70 line-through">R$ 119,90</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: GOLD, color: NAVY }}
            >
              -44% OFF
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className="text-3xl"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: GOLD }}
            >
              R$ 67,00
            </span>
          </div>
        </div>

        <a
          href={KIWIFY_CHECKOUT_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCheckout}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition-transform active:scale-[0.98]"
          style={{
            background: `linear-gradient(180deg, #E7BE5C, ${GOLD})`,
            color: NAVY,
            boxShadow: "0 10px 22px -10px rgba(175,127,53,0.7)",
          }}
        >
          <Sparkles className="size-4" />
          Quero meu plano de 30 dias
          <ChevronRight className="size-4" />
        </a>

        <p className="mt-3 flex items-start gap-2 text-[11px] leading-snug opacity-85">
          <ShieldCheck className="size-4 shrink-0" style={{ color: GOLD }} />
          Garantia de 7 dias: se não fizer sentido pra você, devolvemos 100% do valor.
        </p>
      </div>
    </section>
  );
}

export default OfertaPremiumInline;
