import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, HelpCircle } from "lucide-react";
import draGabrielaAsset from "@/assets/gabi-portrait.png.asset.json";
import { MapaQuizDialog } from "@/components/MapaQuizDialog";

export const Route = createFileRoute("/oferta")({
  component: OfertaPage,
  head: () => ({
    meta: [
      { title: "Mapa do Lipedema, descubra seu perfil em 2 minutos" },
      {
        name: "description",
        content:
          "Não é falta de esforço, é lipedema. Responda 8 perguntas e receba seu mapa personalizado com a Dra. Gabriela Rosado (CRN 10582).",
      },
      { property: "og:title", content: "Mapa do Lipedema, Dra. Gabriela Rosado" },
      {
        property: "og:description",
        content:
          "Leitura personalizada do seu lipedema em 2 min. Sem dieta restritiva. Direto no seu WhatsApp.",
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

function CTA({ onClick, label = "Gerar Meu Mapa" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex w-full md:w-auto items-center justify-center gap-3 rounded-full bg-[hsl(213_60%_17%)] text-[hsl(40_45%_95%)] px-7 py-4 md:px-10 md:py-5 text-[15px] md:text-lg font-medium shadow-[0_18px_40px_-18px_rgba(11,42,74,0.55)] transition-all hover:shadow-[0_22px_50px_-16px_rgba(11,42,74,0.65)] hover:-translate-y-0.5"
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

function OfertaPage() {
  const [open, setOpen] = useState(false);
  const openQuiz = () => setOpen(true);

  return (
    <>
      <main
        className="min-h-[100dvh] bg-[hsl(40_45%_95%)] text-[hsl(213_60%_17%)]"
        style={{ background: CREAM }}
      >
        {/* Header */}
        <header className="relative">
          <div className="mx-auto max-w-6xl px-5 md:px-6 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 flex items-center justify-between">
            <span className="text-[10px] md:text-[11px] tracking-[0.28em] uppercase text-[hsl(38_45%_40%)] font-medium">
              Zero Lipedema
            </span>
            <span className="text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-[hsl(38_45%_40%)]">
              CRN 10582
            </span>
          </div>
        </header>

        {/* 2. HERO */}
        <section className="relative">
          <ArcsBg />
          <div className="relative mx-auto max-w-6xl px-5 md:px-6 pt-6 md:pt-14 pb-12 md:pb-20">
            <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-8 md:gap-14 items-center">
              <div className="order-2 md:order-1">
                <p className="hidden md:block text-[11px] tracking-[0.32em] uppercase text-[hsl(38_60%_38%)] mb-6">
                  Mapa do Lipedema · Teste de 2 min
                </p>
                <h1 className="font-serif leading-[1.05] tracking-tight text-[clamp(1.6rem,6.4vw,3.4rem)] md:text-6xl">
                  Não é falta de esforço.{" "}
                  <em className="text-[hsl(38_55%_42%)] font-serif italic">É lipedema</em>&nbsp;e tem
                  solução sem dietas restritas e sofrimento.
                </h1>
                <p className="mt-4 md:mt-6 text-[14px] md:text-lg text-[hsl(213_30%_28%)] max-w-xl leading-relaxed">
                  Sou a <strong className="font-semibold">Dra. Gabriela Rosado</strong>, especialista em lipedema.
                </p>
                <div className="mt-6 md:mt-8">
                  <CTA onClick={openQuiz} />
                </div>
              </div>
              <div className="order-1 md:order-2 flex justify-center">
                <div className="relative w-[55vw] max-w-[240px] md:w-full md:max-w-none aspect-[4/5] rounded-[1.25rem] md:rounded-[1.75rem] overflow-hidden border border-[hsl(38_35%_75%)]/60 shadow-[0_20px_40px_-20px_rgba(11,42,74,0.35)] bg-[hsl(40_30%_92%)]">
                  <img
                    src={draGabrielaAsset.url}
                    alt="Dra. Gabriela Rosado, especialista em lipedema (CRN 10582)"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. VALIDAÇÃO DA DOR */}
        <section className="relative border-t border-[hsl(38_35%_80%)]/50">
          <div className="mx-auto max-w-4xl px-5 md:px-6 py-14 md:py-20">
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
          <div className="relative mx-auto max-w-4xl px-5 md:px-6 py-14 md:py-20 flex flex-col items-center">
            <PhoneMockup />
            <p className="mt-7 max-w-md text-center text-[14px] md:text-base leading-relaxed text-[hsl(213_30%_28%)]">
              É assim que fica o seu Mapa, pronto em 2 minutos e enviado no seu WhatsApp.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[hsl(38_45%_65%)]/70 bg-[hsl(40_45%_97%)] px-3.5 py-1.5 text-[11px] md:text-[12px] text-[hsl(38_45%_32%)]">
              🎁 Bônus incluso: teste grátis de análise de refeição por foto
            </span>
          </div>
        </section>


        {/* 5. AUTORIDADE */}
        <section className="relative border-t border-[hsl(38_35%_80%)]/50">
          <div className="mx-auto max-w-5xl px-5 md:px-6 py-14 md:py-20">
            <div className="grid md:grid-cols-[0.85fr_1.15fr] gap-8 md:gap-12 items-center">
              <div className="flex justify-center">
                <div className="relative w-[55vw] max-w-[240px] md:w-full md:max-w-[320px] aspect-[4/5] rounded-[1.5rem] overflow-hidden border border-[hsl(38_35%_75%)]/60 shadow-[0_20px_40px_-20px_rgba(11,42,74,0.35)] bg-[hsl(40_30%_92%)]">
                  <img
                    src={draGabrielaAsset.url}
                    alt="Dra. Gabriela Rosado"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <div>
                <SectionTitle>Quem te acompanha</SectionTitle>
                <p className="mt-5 text-[15px] md:text-lg leading-relaxed text-[hsl(213_30%_25%)]">
                  <strong className="font-semibold">Dra. Gabriela Rosado</strong>, especialista em lipedema.
                </p>
                <p className="mt-3 text-[14px] md:text-base leading-relaxed text-[hsl(213_25%_35%)]">
                  Lipedema não tem cura, mas tem direção, e cuidado contínuo faz diferença real no
                  seu dia a dia.
                </p>
              </div>
            </div>
          </div>
        </section>





        {/* 7. COMO FUNCIONA */}
        <section className="relative border-t border-[hsl(38_35%_80%)]/50 bg-[hsl(40_40%_92%)]">
          <ArcsBg />
          <div className="relative mx-auto max-w-5xl px-5 md:px-6 py-14 md:py-20">
            <SectionTitle>Como funciona o Mapa do Lipedema</SectionTitle>
            <ol className="mt-8 md:mt-10 grid md:grid-cols-3 gap-5 md:gap-6">
              {[
                {
                  n: 1,
                  t: "Responda 8 perguntas rápidas (~2 min) sobre seus sintomas e histórico.",
                },
                {
                  n: 2,
                  t: "Receba uma leitura personalizada: seu perfil percebido + 3 prioridades pra começar essa semana e um manual de dicas praticas para aplicar rápidamente.",
                },
                {
                  n: 3,
                  t: "Saiba como funciona o tratamento sem dietas restritivas, aprendendo a conhecer o seu corpo e moldar seus hábitos.",
                },
              ].map((s) => (
                <li
                  key={s.n}
                  className="relative rounded-2xl bg-[hsl(40_45%_97%)] border border-[hsl(38_35%_80%)]/60 p-6 shadow-[0_10px_30px_-15px_rgba(11,42,74,0.25)]"
                >
                  <div className="w-9 h-9 rounded-full bg-[hsl(213_60%_17%)] text-[hsl(40_45%_95%)] flex items-center justify-center font-serif text-lg mb-3">
                    {s.n}
                  </div>
                  <p className="text-[14px] md:text-[15px] leading-relaxed text-[hsl(213_30%_25%)]">
                    {s.t}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-[12px] md:text-[13px] text-[hsl(213_20%_45%)] text-center md:text-left">
              A partir de R$57, sem assinatura obrigatória.
            </p>
          </div>
        </section>

        {/* 8. FAQ */}
        <section className="relative border-t border-[hsl(38_35%_80%)]/50">
          <div className="mx-auto max-w-3xl px-5 md:px-6 py-14 md:py-20">
            <SectionTitle>Perguntas frequentes</SectionTitle>
            <div className="mt-8 space-y-3">
              {[
                {
                  q: "Isso substitui uma consulta médica?",
                  a: "Não. É um conteúdo educacional que te ajuda a entender seus sintomas e organizar os primeiros passos.",
                },
                {
                  q: "Isso é sobre emagrecer?",
                  a: "Não é uma dieta restritiva nem promete emagrecimento, é sobre entender o padrão do lipedema e cuidar dele de forma sustentável.",
                },
                {
                  q: "Precisa de assinatura?",
                  a: "Não. Você recebe uma avaliação gratuita (o Mapa). Quem quiser aprofundar pode adquirir o plano premium, com leitura de exames, anamnese completa e prescrição personalizada.",
                },
                {
                  q: "É indicado pra qualquer estágio?",
                  a: "O Mapa te dá uma leitura inicial e os primeiros passos para começar; casos mais avançados se beneficiam ainda mais do acompanhamento com anamnese completa.",
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
          <div className="relative mx-auto max-w-3xl px-5 md:px-6 py-14 md:py-20 text-center">
            <h2 className="font-serif text-[clamp(1.6rem,4.8vw,2.4rem)] leading-tight">
              Pronta para entender o que está acontecendo com o seu corpo?
            </h2>
            <p className="mt-4 text-[14px] md:text-base text-[hsl(38_55%_82%)] max-w-lg mx-auto">
              Responda as perguntas e em 2 minutos te envio o acesso ao seu mapa no seu WhatsApp
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
