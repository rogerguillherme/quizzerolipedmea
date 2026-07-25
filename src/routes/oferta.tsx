import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, HelpCircle } from "lucide-react";
import draGabrielaAsset from "@/assets/dra-gabriela.png.asset.json";
import { MapaQuizDialog } from "@/components/MapaQuizDialog";

export const Route = createFileRoute("/oferta")({
  component: OfertaPage,
  head: () => ({
    meta: [
      { title: "Mapa do Lipedema — Descubra seu perfil em 2 minutos" },
      {
        name: "description",
        content:
          "Não é falta de esforço, é lipedema. Responda 8 perguntas e receba seu mapa personalizado com a Dra. Gabriela Rosado (CRN 10582).",
      },
      { property: "og:title", content: "Mapa do Lipedema — Dra. Gabriela Rosado" },
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
                  <em className="text-[hsl(38_55%_42%)] font-serif italic">É lipedema</em> — e tem
                  solução sem dietas restritas e sofrimento.
                </h1>
                <p className="mt-4 md:mt-6 text-[14px] md:text-lg text-[hsl(213_30%_28%)] max-w-xl leading-relaxed">
                  Sou a <strong className="font-semibold">Dra. Gabriela Rosado</strong>,
                  nutricionista especialista em lipedema. Respondendo 8 perguntas rápidas você
                  recebe seu mapa personalizado — direto aqui e também no seu WhatsApp.
                </p>
                <div className="mt-6 md:mt-8">
                  <CTA onClick={openQuiz} />
                  <p className="mt-3 text-[11px] md:text-xs text-[hsl(213_20%_40%)]">
                    Leitura educacional. Não substitui avaliação médica.
                  </p>
                </div>
              </div>
              <div className="order-1 md:order-2 flex justify-center">
                <div className="relative w-[55vw] max-w-[240px] md:w-full md:max-w-none aspect-[4/5] rounded-[1.25rem] md:rounded-[1.75rem] overflow-hidden border border-[hsl(38_35%_75%)]/60 shadow-[0_20px_40px_-20px_rgba(11,42,74,0.35)] bg-[hsl(40_30%_92%)]">
                  <img
                    src={draGabrielaAsset.url}
                    alt="Dra. Gabriela Rosado, nutricionista especialista em lipedema (CRN 10582)"
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

        {/* 4. POR QUE DIETA E TREINO NÃO BASTAM */}
        <section className="relative border-t border-[hsl(38_35%_80%)]/50 bg-[hsl(40_40%_92%)]">
          <ArcsBg />
          <div className="relative mx-auto max-w-4xl px-5 md:px-6 py-14 md:py-20">
            <SectionTitle>
              O problema não é força de vontade — é o que ninguém te explicou sobre lipedema.
            </SectionTitle>
            <p className="mt-6 md:mt-8 text-[15px] md:text-lg leading-relaxed text-[hsl(213_30%_25%)]">
              Lipedema é um acúmulo de gordura com padrão próprio, geralmente ligado a fatores
              hormonais, que não responde só à equação "coma menos, treine mais". Por isso tantas
              mulheres fazem tudo certo e não veem o resultado esperado nas pernas. Entender isso é
              o primeiro passo — o segundo é ter um caminho estruturado pensado especificamente pra
              esse padrão.
            </p>
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
                  <strong className="font-semibold">Dra. Gabriela Rosado</strong>, nutricionista
                  (CRN 10582) especialista em lipedema.
                </p>
                <p className="mt-3 text-[14px] md:text-base leading-relaxed text-[hsl(213_25%_35%)]">
                  Atendimento acolhedor e direto: lipedema não tem cura, mas tem direção — e cuidado
                  contínuo faz diferença real no seu dia a dia.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. VEJA COMO FICA DENTRO DO APP */}
        <section className="relative border-t border-[hsl(38_35%_80%)]/50">
          <div className="relative mx-auto max-w-6xl px-5 md:px-6 py-14 md:py-20">
            <SectionTitle>Veja como fica dentro do app</SectionTitle>
            <div className="mt-8 md:mt-12 grid md:grid-cols-2 gap-6 md:gap-8">
              {/* Preview 1 — Mapa */}
              <div>
                <div className="rounded-2xl bg-[hsl(40_45%_97%)] border border-[hsl(38_35%_80%)]/60 p-6 md:p-7 shadow-[0_20px_50px_-25px_rgba(11,42,74,0.35)]">
                  <p className="text-[10px] tracking-[0.32em] uppercase text-[hsl(38_60%_38%)] font-medium">
                    Mapa personalizado
                  </p>
                  <h3 className="mt-2 font-serif text-[22px] md:text-2xl leading-tight text-[hsl(213_60%_17%)]">
                    Sua leitura do lipedema
                  </h3>
                  <p className="mt-4 text-[13.5px] md:text-sm leading-relaxed text-[hsl(213_30%_28%)]">
                    Pelo que você descreveu, o padrão sugere um quadro compatível com lipedema — as
                    pernas guardam volume mesmo com esforço no resto do corpo, e isso não é falta de
                    disciplina.
                  </p>
                  <div className="mt-5 flex items-center gap-2 rounded-lg bg-[hsl(40_40%_92%)] border border-[hsl(38_35%_80%)]/60 px-3 py-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[hsl(38_60%_38%)]">
                      Estágio percebido
                    </span>
                    <span className="ml-auto font-serif text-[hsl(213_60%_17%)] text-[15px]">
                      Intermediário
                    </span>
                  </div>
                  <p className="mt-5 text-[11px] uppercase tracking-[0.24em] text-[hsl(38_60%_38%)] font-medium">
                    Suas 3 prioridades
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {[
                      "Reduzir alimentos ultraprocessados e inflamatórios",
                      "Incluir chá/shot indicado no ritual da manhã",
                      "Movimento leve diário, sem exigir treino pesado",
                    ].map((p, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-[13.5px] md:text-sm text-[hsl(213_30%_25%)]"
                      >
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-[hsl(213_60%_17%)] text-[hsl(40_45%_95%)] flex items-center justify-center font-serif text-[11px] shrink-0">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-4 text-[12px] md:text-[13px] text-[hsl(213_20%_45%)] text-center">
                  Seu mapa personalizado, com estágio percebido e as 3 prioridades da semana.
                </p>
              </div>

              {/* Preview 2 — Protocolo 7 Dias */}
              <div>
                <div className="rounded-2xl bg-[hsl(40_45%_97%)] border border-[hsl(38_35%_80%)]/60 p-6 md:p-7 shadow-[0_20px_50px_-25px_rgba(11,42,74,0.35)]">
                  <p className="text-[10px] tracking-[0.32em] uppercase text-[hsl(38_60%_38%)] font-medium">
                    Em andamento
                  </p>
                  <h3 className="mt-2 font-serif text-[22px] md:text-2xl leading-tight text-[hsl(213_60%_17%)]">
                    Seu Protocolo de 7 Dias
                  </h3>
                  <div className="mt-5 flex items-center justify-between text-[12px] text-[hsl(213_25%_35%)]">
                    <span>Dias cumpridos</span>
                    <span className="font-medium text-[hsl(213_60%_17%)]">1 / 7</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[hsl(40_40%_92%)] overflow-hidden">
                    <div
                      className="h-full bg-[hsl(38_55%_58%)]"
                      style={{ width: `${(1 / 7) * 100}%` }}
                    />
                  </div>
                  <div className="mt-5 grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const active = i === 0;
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium border ${
                            active
                              ? "bg-[hsl(38_55%_58%)] text-[hsl(213_60%_12%)] border-[hsl(38_55%_58%)]"
                              : "bg-transparent text-[hsl(213_25%_40%)] border-[hsl(38_35%_80%)]/60"
                          }`}
                        >
                          D{i + 1}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-5 text-[12.5px] md:text-[13px] leading-relaxed text-[hsl(213_25%_35%)]">
                    Sem responder é ok — o protocolo continua no seu ritmo. Nenhum dia perdido, nada
                    cobrado.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-[hsl(38_35%_75%)]/70 px-3.5 py-1.5 text-[12px] text-[hsl(213_60%_17%)] bg-[hsl(40_40%_94%)]">
                      Lista de compras
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[hsl(38_35%_75%)]/70 px-3.5 py-1.5 text-[12px] text-[hsl(213_60%_17%)] bg-[hsl(40_40%_94%)]">
                      Progresso
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-[12px] md:text-[13px] text-[hsl(213_20%_45%)] text-center">
                  Protocolo de 7 Dias ativo — dias marcados sem cobrança, no seu ritmo.
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
                  t: "Receba uma leitura personalizada: seu perfil percebido + 3 prioridades pra começar essa semana.",
                },
                {
                  n: 3,
                  t: "Acesse pelo WhatsApp e continue com o Protocolo de 7 Dias — sugestão alimentar, chá/shot indicado, lista de compras e dicas diárias, por R$57.",
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
              A partir de R$57 — sem assinatura obrigatória.
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
                  a: "Não. É um conteúdo educacional que te ajuda a entender seus sintomas e organizar os primeiros passos — a confirmação clínica depende de avaliação da Dra. Gabriela ou de outro profissional.",
                },
                {
                  q: "Isso é sobre emagrecer?",
                  a: "Não é uma dieta restritiva nem promete emagrecimento — é sobre entender o padrão do lipedema e cuidar dele de forma sustentável.",
                },
                {
                  q: "Precisa de assinatura?",
                  a: "Não. Você começa pelo Plano de R$57 (sugestão alimentar + chás/shots/suplementos gerais, sem personalização). Quem quiser aprofundar tem acesso a planos com leitura de exames, anamnese completa e prescrição personalizada.",
                },
                {
                  q: "É indicado pra qualquer estágio?",
                  a: "O Mapa te dá uma leitura inicial; casos mais avançados se beneficiam ainda mais do acompanhamento com anamnese completa.",
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
              8 perguntas, 2 minutos. Seu mapa chega aqui e no seu WhatsApp.
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

        {/* 9. DISCLAIMER */}
        <footer className="border-t border-[hsl(38_35%_80%)]/40 bg-[hsl(40_40%_92%)]">
          <div className="mx-auto max-w-4xl px-5 md:px-6 py-8 md:py-10">
            <p className="text-[11px] md:text-xs leading-relaxed text-[hsl(213_20%_40%)] text-center">
              Conteúdo educacional e de estilo de vida. Não substitui avaliação médica ou
              nutricional individualizada. Nutricionista (CRN 10582) não prescreve medicamento nem
              exercício estruturado nesta etapa.
            </p>
          </div>
        </footer>
      </main>

      <MapaQuizDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
