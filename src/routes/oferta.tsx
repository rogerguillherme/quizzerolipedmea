import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { trackMeta } from "@/lib/meta-track";
import { track } from "@/lib/analytics";
import { ArrowRight, Check, HelpCircle } from "lucide-react";
import draGabrielaAsset from "@/assets/gabi-portrait.png.asset.json";
import gabiChaAsset from "@/assets/gabi-cha.jpg.asset.json";
import appRadar1 from "@/assets/mockup-8.png.asset.json";
import appDicas1 from "@/assets/mockup-9.png.asset.json";
import appPremium from "@/assets/mockup-10.png.asset.json";
import appAvaliacao from "@/assets/mockup-11.png.asset.json";

import { MapaQuizDialog } from "@/components/MapaQuizDialog";
import { OfertaBackground3D } from "@/components/OfertaBackground3D";

export const Route = createFileRoute("/oferta")({
  component: OfertaPage,
  head: () => ({
    meta: [
      { title: "Mapa do Lipedema, descubra seu perfil em 3 minutos" },
      {
        name: "description",
        content:
          "Não é falta de esforço, é lipedema. Responda 12 perguntas e receba seu mapa personalizado com a Dra. Gabriela Rosado (CRN 10582).",
      },
      { property: "og:title", content: "Mapa do Lipedema, Dra. Gabriela Rosado" },
      {
        property: "og:description",
        content:
          "Leitura personalizada do seu lipedema em 3 min. Sem dieta restritiva. Direto no seu WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: draGabrielaAsset.url },
      { name: "twitter:image", content: draGabrielaAsset.url },
    ],
  }),
});

const CREAM = "hsl(40 45% 95%)";
const BLUE = "hsl(213 60% 17%)";
const GOLD = "hsl(38 55% 42%)";

function ArcsBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        className="absolute -right-40 -top-40 w-[600px] h-[600px] opacity-[0.18]"
        viewBox="0 0 400 400"
        fill="none"
      >
        {[80, 130, 180, 230, 280].map((r) => (
          <circle key={r} cx="200" cy="200" r={r} stroke={GOLD} strokeWidth="1" />
        ))}
      </svg>
      <svg
        className="absolute -left-32 top-1/2 w-[520px] h-[520px] opacity-[0.12]"
        viewBox="0 0 400 400"
        fill="none"
      >
        {[70, 120, 170, 220].map((r) => (
          <circle key={r} cx="200" cy="200" r={r} stroke={GOLD} strokeWidth="1" />
        ))}
      </svg>
    </div>
  );
}

function CTA({
  onClick,
  label = "Gerar Meu Mapa",
  variant = "navy",
}: {
  onClick: () => void;
  label?: string;
  variant?: "navy" | "gold";
}) {
  const styles =
    variant === "gold"
      ? "bg-[hsl(38_55%_58%)] text-[hsl(213_60%_12%)] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)]"
      : "bg-[hsl(213_60%_17%)] text-[hsl(40_45%_95%)] shadow-[0_18px_40px_-18px_rgba(11,42,74,0.55)]";
  return (
    <button
      onClick={onClick}
      className={`group inline-flex w-full md:w-auto items-center justify-center gap-3 rounded-full px-7 py-4 md:px-10 md:py-5 text-[15px] md:text-lg font-medium transition-all hover:-translate-y-0.5 ${styles}`}
    >
      <span>{label}</span>
      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
    </button>
  );
}


function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-[clamp(1.6rem,4.5vw,2.4rem)] leading-tight tracking-tight text-[hsl(213_60%_17%)]">
      {children}
    </h2>
  );
}

/**
 * Mockup ilustrativo da tela de resultado do Mapa (conteúdo fixo, não real).
 * Replica visualmente a seção `Resultado` de src/routes/mapa.tsx.
 */
const telasApp: string[] = [
  appRadar1.url,
  appDicas1.url,
  appAvaliacao.url,
  appPremium.url,
];

function PhoneMockup() {
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setSlide((s) => (s + 1) % telasApp.length),
      2600,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative">
      {/* glow atrás do celular */}
      <div
        className="absolute -inset-10 -z-10 rounded-full blur-3xl opacity-50"
        style={{ background: "radial-gradient(circle, hsl(38 55% 65%), transparent 70%)" }}
        aria-hidden
      />

      {/* badge flutuante 1 */}
      <div
        className="absolute -left-8 top-10 z-20 hidden sm:flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-[0_10px_24px_-10px_rgba(11,42,74,0.4)] rotate-[-6deg]"
        aria-hidden
      >
        <span className="text-[13px]">✅</span>
        <span className="text-[10.5px] font-semibold text-[hsl(213_60%_17%)]">Pronto em 3 min</span>
      </div>

      {/* badge flutuante 2 */}
      <div
        className="absolute -right-6 bottom-16 z-20 hidden sm:flex items-center gap-1.5 rounded-2xl bg-[hsl(140_45%_94%)] px-3 py-2 shadow-[0_10px_24px_-10px_rgba(11,42,74,0.4)] rotate-[4deg]"
        aria-hidden
      >
        <span className="text-[13px]">💬</span>
        <span className="text-[10.5px] font-semibold text-[hsl(150_35%_28%)]">Chegou no WhatsApp!</span>
      </div>

      <div
        className="relative w-[250px] md:w-[280px] aspect-[9/19.3] rounded-[2.6rem] bg-[hsl(213_60%_15%)] p-[9px] shadow-[0_45px_90px_-25px_rgba(11,42,74,0.55),0_0_0_1px_rgba(255,255,255,0.08)_inset] rotate-[-3deg]"
      >
        {/* dynamic island */}
        <div className="absolute left-1/2 top-[11px] -translate-x-1/2 h-[20px] w-[84px] rounded-full bg-black z-20" aria-hidden />

        {/* tela: telas reais do app passando */}
        <div className="relative h-full w-full overflow-hidden rounded-[2.05rem] bg-[hsl(40_45%_97%)]">
          {telasApp.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700"
              style={{ opacity: slide === i ? 1 : 0 }}
            />
          ))}
        </div>


        {/* home indicator */}
        <div className="absolute bottom-[7px] left-1/2 -translate-x-1/2 h-1 w-24 rounded-full bg-white/60 z-20" aria-hidden />
      </div>
    </div>
  );
}

function OfertaPage() {

  const [open, setOpen] = useState(false);

  // Visualização da página de venda: base de otimização/retargeting da Meta.
  useEffect(() => {
    track("landing_view", { pagina: "oferta" });
    trackMeta("ViewContent", {
      content_name: "Oferta Zero Lipedema",
      content_type: "product",
      value: 67,
      currency: "BRL",
    });
  }, []);

  const openQuiz = () => {
    trackMeta("QuizAberto", { content_name: "Mapa do Lipedema", source: "oferta" });
    setOpen(true);
  };

  return (
    <>
      {/* camada de fundo creme fixa + partículas 3D por trás de todo o conteúdo */}
      <div className="fixed inset-0 -z-20" style={{ background: CREAM }} aria-hidden />
      <OfertaBackground3D />
      <main className="relative min-h-[100dvh] text-[hsl(213_60%_17%)]">


        {/* Header + HERO com foto de fundo full-bleed */}
        <section className="relative isolate overflow-hidden flex min-h-[94dvh] md:min-h-[100dvh] flex-col">
          {/* foto de fundo */}
          <img
            src={draGabrielaAsset.url}
            alt="Dra. Gabriela Rosado, especialista em lipedema (CRN 10582)"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-top"
            loading="eager"
          />
          {/* overlay em gradiente safira */}
          <div
            className="absolute inset-0 -z-10"
            aria-hidden
            style={{
              background:
                "linear-gradient(to bottom, hsl(213 60% 17% / 0.42) 0%, hsl(213 60% 17% / 0.4) 35%, hsl(213 60% 17% / 0.78) 68%, hsl(213 60% 17% / 0.92) 100%)",
            }}
          />
          <ArcsBg />

          {/* Header */}
          <header className="relative">
            <div className="mx-auto max-w-6xl px-5 md:px-8 pt-[max(env(safe-area-inset-top),1rem)] pb-4 flex items-center justify-between">
              <span className="text-[10px] md:text-[11px] tracking-[0.28em] uppercase text-[hsl(40_45%_92%)]/80 font-medium">
                Zero Lipedema
              </span>
              <span className="text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-[hsl(40_45%_92%)]/80">
                CRN 10582
              </span>
            </div>
          </header>

          {/* bloco de texto ancorado no fim da seção, logo acima da transição */}
          <div className="relative z-10 mt-auto mx-auto w-full max-w-6xl px-5 md:px-8 pt-20 pb-32 md:pb-44">
            <div className="max-w-2xl">
              <p className="hidden md:block text-[11px] tracking-[0.32em] uppercase text-[hsl(38_65%_72%)] mb-7">
                Mapa do Lipedema · Teste de 3 min
              </p>
              <h1 className="font-serif leading-[1.05] tracking-tight text-[clamp(1.75rem,6.8vw,3.4rem)] md:text-6xl text-[hsl(40_45%_95%)] [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
                Não é falta de esforço.{" "}
                <em className="text-[hsl(38_70%_68%)] font-serif italic">É lipedema</em>&nbsp;e tem
                solução sem dietas restritas e sofrimento.
              </h1>
              <p className="mt-5 md:mt-7 text-[15px] md:text-lg text-[hsl(40_35%_88%)] max-w-xl leading-relaxed">
                Sou a <strong className="font-semibold">Dra. Gabriela Rosado</strong>, especialista em lipedema.
              </p>
              <div className="mt-8 md:mt-10">
                <CTA onClick={openQuiz} variant="gold" />
              </div>
            </div>
          </div>


          {/* transição suave para o fundo creme */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 md:h-56 backdrop-blur-[2px]"
            aria-hidden
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, hsl(40 45% 95% / 0.55) 55%, hsl(40 45% 95%) 100%)",
              maskImage: "linear-gradient(to bottom, transparent, black 40%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent, black 40%)",
            }}
          />
        </section>


        {/* 3. VALIDAÇÃO DA DOR */}
        <section className="relative border-t border-[hsl(38_35%_80%)]/50">
          <div className="mx-auto max-w-4xl px-5 md:px-8 py-16 md:py-28">
            <SectionTitle>Se algo aqui soa familiar, você não está exagerando.</SectionTitle>
            <ul className="mt-8 md:mt-10 space-y-4 md:space-y-5 text-[15px] md:text-lg text-[hsl(213_30%_25%)]">
              {[
                "Você já tentou dieta e treino e as pernas não mudaram do mesmo jeito que o resto do corpo.",
                "A calça aperta diferente hoje do que apertava há alguns anos, mesmo sem grandes mudanças de peso.",
                "Você sente que precisa se justificar quando fala sobre o inchaço ou a dor.",
                'Já ouviu que "é só emagrecer", e isso nunca resolveu de verdade.',
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-1 text-[hsl(38_60%_45%)] shrink-0" />
                  <span className="leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. MOCKUP DO RESULTADO */}
        <section className="relative border-t border-[hsl(38_35%_80%)]/50 bg-[hsl(40_40%_92%)]">
          <ArcsBg />
          <div className="relative mx-auto max-w-4xl px-5 md:px-8 py-16 md:py-28 flex flex-col items-center">
            <PhoneMockup />
            <p className="mt-7 max-w-md text-center text-[14px] md:text-base leading-relaxed text-[hsl(213_30%_28%)]">
              É assim que fica o seu Mapa, pronto em 3 minutos e enviado no seu WhatsApp.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[hsl(38_45%_65%)]/70 bg-[hsl(40_45%_97%)] px-3.5 py-1.5 text-[11px] md:text-[12px] text-[hsl(38_45%_32%)]">
              🎁 Bônus incluso: teste grátis de análise de refeição por foto
            </span>
          </div>
        </section>


        {/* 5. AUTORIDADE */}
        <section className="relative border-t border-[hsl(38_35%_80%)]/50">
          <div className="mx-auto max-w-5xl px-5 md:px-8 py-16 md:py-28">
            <div className="grid md:grid-cols-[0.85fr_1.15fr] gap-8 md:gap-12 items-center">
              <div className="flex justify-center">
                <div className="relative w-[55vw] max-w-[240px] md:w-full md:max-w-[320px] aspect-[4/5] rounded-[1.5rem] overflow-hidden border border-[hsl(38_35%_75%)]/60 shadow-[0_20px_40px_-20px_rgba(11,42,74,0.35)] bg-[hsl(40_30%_92%)]">
                  <img
                    src={gabiChaAsset.url}

                    alt="Dra. Gabriela Rosado"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <div>
                <SectionTitle>Quem te acompanha</SectionTitle>
                <p className="mt-5 text-[15px] md:text-lg leading-relaxed text-[hsl(213_30%_25%)]">
                  <strong className="font-semibold">Dra. Gabriela Rosado</strong>, especialista em
                  lipedema, com anos de consultório dedicados a entender o padrão hormonal e
                  inflamatório por trás do inchaço e da dor nas pernas. A metodologia Zero Lipedema
                  nasceu dessa prática real, já aplicada com dezenas de mulheres, e segue evoluindo
                  a cada caso.
                </p>
                <p className="mt-4 text-[15px] md:text-lg leading-relaxed text-[hsl(213_30%_25%)]">
                  Não é mais uma dieta restritiva, ninguém vai te dizer só pra cortar doce e fritura
                  e "vai emagrecer". É sobre reduzir a inflamação do seu corpo, ajustar hábitos
                  reais do seu dia a dia e manter o resultado de forma consistente, sem viver de
                  dieta.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* 8. FAQ */}
        <section className="relative border-t border-[hsl(38_35%_80%)]/50">
          <div className="mx-auto max-w-3xl px-5 md:px-8 py-16 md:py-28">
            <SectionTitle>Perguntas frequentes</SectionTitle>
            <div className="mt-8 space-y-3">
              {[
                {
                  q: "Isso substitui uma consulta médica?",
                  a: "Não. É um conteúdo educacional que te ajuda a entender seus sintomas e organizar os primeiros passos.",
                },
                {
                  q: "Precisa de assinatura?",
                  a: "Não. O Mapa é gratuito e o Plano Premium é pagamento único de R$67, sem renovação automática. Você tem 7 dias de garantia: se não fizer sentido, devolvemos o valor.",
                },

              ].map((f, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-[hsl(38_35%_80%)]/60 bg-[hsl(40_45%_97%)] px-5 py-4 open:shadow-[0_8px_24px_-16px_rgba(11,42,74,0.3)]"
                >
                  <summary className="flex cursor-pointer items-start gap-3 list-none font-serif text-[15px] md:text-[17px] text-[hsl(213_60%_17%)]">
                    <HelpCircle className="w-5 h-5 mt-0.5 text-[hsl(38_60%_45%)] shrink-0" />
                    <span className="flex-1">{f.q}</span>
                    <span className="text-[hsl(38_55%_42%)] transition-transform group-open:rotate-45 text-xl leading-none">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 pl-8 text-[14px] md:text-[15px] leading-relaxed text-[hsl(213_28%_28%)]">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 10. CTA FINAL */}
        <section className="relative border-t border-[hsl(38_35%_80%)]/50 bg-[hsl(213_60%_17%)] text-[hsl(40_45%_95%)]">
          <div className="relative mx-auto max-w-3xl px-5 md:px-8 py-16 md:py-28 text-center">
            <h2 className="font-serif text-[clamp(1.6rem,4.8vw,2.4rem)] leading-tight">
              Pronta para entender o que está acontecendo com o seu corpo?
            </h2>
            <p className="mt-4 text-[14px] md:text-base text-[hsl(38_55%_82%)] max-w-lg mx-auto">
              Responda as perguntas e em 3 minutos te envio o acesso ao seu mapa no seu WhatsApp
            </p>
            <div className="mt-8 flex justify-center">
              <button
                onClick={openQuiz}
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-[hsl(38_55%_58%)] text-[hsl(213_60%_12%)] px-8 py-4 md:px-10 md:py-5 text-[15px] md:text-lg font-medium shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 transition-all"
              >
                <span>Gerar Meu Mapa</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

          </div>
        </section>

      </main>

      <MapaQuizDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
