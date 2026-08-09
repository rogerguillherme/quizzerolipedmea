import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Check } from "lucide-react";
import { PlanoBackground3D } from "@/components/PlanoBackground3D";
import { MapaPopup } from "@/components/MapaPopup";
import { KIWIFY_CHECKOUT_URL } from "@/components/OfertaPremiumInline";
import { PREMIUM_FEATURES } from "@/lib/premium-features";
import { lerMapaSessao, mapaJaEnviado, type MapaSessao } from "@/lib/mapa-sessao";
import { track } from "@/lib/analytics";
import { trackMeta } from "@/lib/meta-track";
import gabiPortrait from "@/assets/gabi-portrait.png.asset.json";

export const Route = createFileRoute("/plano")({
  component: PlanoPage,
  head: () => ({
    meta: [
      { title: "Plano Zero Lipedema — 30 dias com a Dra. Gabriela Rosado" },
      {
        name: "description",
        content:
          "Lipedema não responde a dieta comum. Veja o plano de 30 dias da nutricionista Gabriela Rosado (CRN 10582) por R$67, pagamento único e 7 dias de garantia.",
      },
      { property: "og:title", content: "Plano Zero Lipedema — 30 dias" },
      {
        property: "og:description",
        content:
          "Você não falhou: te deram a ferramenta errada. Rotina, guias e acompanhamento por R$67, pagamento único.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/**
 * Paleta exclusiva da /plano, com amplitude tonal maior que a do app:
 * creme mais claro em cima, navy mais fundo embaixo, dourado mais saturado.
 * Não reaproveitar em outras rotas — aqui o alvo é brilho, não sobriedade.
 */
const C = {
  navy: "#123050",
  navyDeep: "#05131F",
  navySoft: "#2E5F8C",
  cream: "#FBF6EC",
  creamDeep: "#FFFBF3",
  gold: "#C0872A",
  goldLight: "#EFC96B",
  goldGlow: "#FAE4A8",
  /** Rótulo pequeno sobre creme: dourado profundo mantém AA. */
  goldLabel: "#8A6224",
  line: "#E8DCC0",
  ink: "#2A2C24",
} as const;

/** Degradê metálico compartilhado (botões, itálicos, preço). */
const SHINE =
  "linear-gradient(135deg,#F7DC96 0%,#E0AF48 26%,#C0872A 52%,#EFC96B 78%,#D9A94B 100%)";

/**
 * CSS local da rota. Vive aqui, e não em styles.css, justamente para não
 * vazar para o app: tudo está prefixado por `.pl`.
 */
const PLANO_CSS = `
.pl-luz{
  position:fixed; inset:0; z-index:-19; pointer-events:none;
  background:
    radial-gradient(120% 65% at 50% -8%, rgba(250,228,168,.55), transparent 62%),
    radial-gradient(90% 55% at 88% 22%, rgba(46,95,140,.13), transparent 60%);
  background-attachment: fixed;
}
.pl-card{
  background: linear-gradient(180deg,#FFFFFF 0%,#FFFBF3 100%);
  border:1px solid ${C.line};
  box-shadow:
    0 1px 0 rgba(255,255,255,.9) inset,
    0 10px 26px -20px rgba(18,48,80,.45);
}
.pl-em{
  font-style:italic;
  background:${SHINE};
  -webkit-background-clip:text; background-clip:text;
  color:transparent;
}
.pl-price{
  background:linear-gradient(135deg,#FFF3CE 0%,#F7DC96 22%,#EFC96B 48%,#E0AF48 74%,#F7DC96 100%);
  -webkit-background-clip:text; background-clip:text;
  color:transparent;
}
.pl-btn-gold{
  position:relative; overflow:hidden;
  color:#2A1A05;
  background:${SHINE};
  background-size:180% 180%;
  background-position:0% 50%;
  transition:background-position .6s ease, transform .2s ease;
  box-shadow:
    0 1px 0 rgba(255,255,255,.75) inset,
    0 -2px 6px rgba(90,58,8,.35) inset,
    0 14px 30px -16px rgba(192,135,42,.75);
}
.pl-btn-gold:hover{ background-position:100% 50%; }
.pl-btn-gold::after{
  content:""; position:absolute; top:-60%; bottom:-60%; width:38%;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.62),transparent);
  transform:skewX(-18deg);
  animation:pl-sweep 4.5s ease-in-out infinite;
}
@keyframes pl-sweep{
  0%,72%{ left:-45%; }
  100%{ left:125%; }
}
.pl-btn-navy{
  color:#fff;
  background:linear-gradient(168deg,#1A4066 0%,#123050 55%,#08203A 100%);
  box-shadow:
    0 1px 0 rgba(255,255,255,.14) inset,
    0 14px 30px -18px rgba(5,19,31,.85);
}
.pl-espelho{
  background:
    radial-gradient(85% 60% at 22% 0%, rgba(239,201,107,.14), transparent 60%),
    linear-gradient(168deg,#1A4066 0%,#123050 46%,#08203A 100%);
}
.pl-preco{
  background:
    radial-gradient(80% 55% at 50% 0%, rgba(239,201,107,.18), transparent 62%),
    linear-gradient(168deg,#22557F 0%,#123050 48%,#05131F 100%);
  border:1px solid rgba(239,201,107,.42);
  box-shadow:0 0 60px -18px rgba(239,201,107,.35);
}
.pl-semana-num{
  display:inline-flex; align-items:center; justify-content:center;
  min-width:30px; height:30px; padding:0 9px; border-radius:9999px;
  font-size:13px; font-weight:800; color:#4A3208;
  background:linear-gradient(160deg,#FAE4A8 0%,#EFC96B 45%,#C0872A 100%);
  box-shadow:0 1px 0 rgba(255,255,255,.7) inset, 0 6px 14px -10px rgba(192,135,42,.9);
}
.pl-foto img{ filter:saturate(1.12) contrast(1.06) brightness(1.03); }
.pl-foto-grande{ position:relative; }
.pl-foto-grande::after{
  content:""; position:absolute; inset:0; pointer-events:none;
  border-radius:inherit;
  background:linear-gradient(150deg,rgba(255,255,255,.28),transparent 38%);
  box-shadow:0 0 40px -22px rgba(239,201,107,.75) inset;
}
@media (prefers-reduced-motion: reduce){
  .pl-btn-gold::after{ animation:none; opacity:0; }
  .pl-btn-gold{ transition:none; }
}
`;


// ---------------- Revelação no scroll ----------------
// Entrada de 26px com fade, escalonada em 5 níveis de atraso.
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisivel(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisivel(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visivel ? 1 : 0,
        transform: visivel ? "translateY(0)" : "translateY(26px)",
        transition: `opacity .9s ease ${delay * 0.12}s, transform .9s cubic-bezier(.16,1,.3,1) ${delay * 0.12}s`,
      }}
    >
      {children}
    </div>
  );
}

/** Foto grande com zoom sutil de 1.14 → 1.0 ao entrar na tela. */
function FotoZoom({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dentro, setDentro] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setDentro(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setDentro(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="pl-foto pl-foto-grande overflow-hidden rounded-3xl"
      style={{ aspectRatio: "16 / 10", background: C.creamDeep }}
    >

      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover"
        style={{
          transform: dentro ? "scale(1)" : "scale(1.14)",
          transition: "transform 1.6s cubic-bezier(.16,1,.3,1)",
        }}
      />
    </div>
  );
}

/** Preço contando de 0 a 67 quando o bloco aparece. */
function PrecoAnimado() {
  const ref = useRef<HTMLSpanElement>(null);
  const [valor, setValor] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setValor(67);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.disconnect();
          const inicio = performance.now();
          const dur = 1100;
          const tick = () => {
            const p = Math.min(1, (performance.now() - inicio) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            setValor(Math.round(eased * 67));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <span ref={ref}>{valor}</span>;
}

// ---------------- Conteúdo ----------------
const ESPELHO = [
  "Você emagreceu e as pernas continuaram do mesmo jeito.",
  "Já ouviu que era só fechar a boca.",
  "A perna dói ao toque, e ninguém leva a sério.",
  "Já gastou com chá, drenagem, dieta e treino.",
  "Cansou de recomeçar toda segunda.",
];

const SEMANAS = [
  { n: 1, titulo: "Café da manhã", texto: "A primeira refeição do dia deixa de disparar inflamação e fome." },
  { n: 2, titulo: "Almoço", texto: "Prato montado para saciar sem inchar, com o que você já come em casa." },
  { n: 3, titulo: "Lanche", texto: "O horário que mais derruba plano vira o mais simples da sua rotina." },
  { n: 4, titulo: "Jantar", texto: "Fecha o dia leve, dorme melhor e acorda com a perna menos pesada." },
];

const FAQ = [
  {
    q: "É mais uma dieta?",
    a: "Não. Não tem contagem de caloria nem cardápio proibido. A gente ajusta uma refeição por semana até as quatro principais estarem no padrão anti-inflamatório.",
  },
  {
    q: "Vou conseguir manter?",
    a: "A proposta é justamente essa: uma mudança por semana, com o passo do dia aparecendo pronto no app. Quem tenta mudar tudo de uma vez é quem para na segunda semana.",
  },
  {
    q: "Já tentei de tudo. Por que agora seria diferente?",
    a: "Porque lipedema não responde a restrição. O que você tentou até aqui foi feito para gordura comum, não para o tecido do lipedema, que inflama quando você passa fome.",
  },
  {
    q: "Preciso comprar suplemento ou comida cara?",
    a: "Não. O plano trabalha com alimento de mercado comum, e os guias mostram substituições baratas para cada item.",
  },
  {
    q: "Quanto tempo por dia isso toma?",
    a: "Poucos minutos: você abre o app, vê a missão do dia e, se quiser, fotografa uma refeição para receber a leitura.",
  },
  {
    q: "E se não for para mim?",
    a: "Você tem 7 dias de garantia. Pede o reembolso e devolvemos o valor, sem precisar justificar.",
  },
];

// ---------------- Página ----------------
function PlanoPage() {
  const [sessao, setSessao] = useState<MapaSessao | null>(null);
  const [popupAberto, setPopupAberto] = useState(false);
  const [barraVisivel, setBarraVisivel] = useState(false);

  useEffect(() => {
    track("landing_view", { pagina: "/plano" });
    trackMeta("ViewContent", { content_name: "Plano Zero Lipedema 30d", content_type: "product" });
  }, []);

  // Popup só abre quando existe Mapa nesta sessão e ele ainda não foi enviado.
  useEffect(() => {
    const s = lerMapaSessao();
    if (!s) return;
    setSessao(s);
    if (mapaJaEnviado()) return;
    const t = setTimeout(() => {
      setPopupAberto(true);
      track("mapa_popup_aberto", { lead_id: s.leadId });
    }, 900);
    return () => clearTimeout(t);
  }, []);

  // Barra fixa a partir da primeira dobra.
  useEffect(() => {
    const onScroll = () => setBarraVisivel(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function irParaCheckout(origem: "hero" | "oferta" | "barra") {
    track("checkout_view", { origem, valor: 67 });
    trackMeta("InitiateCheckout", {
      content_name: "Plano Zero Lipedema 30d",
      content_type: "product",
      value: 67,
      currency: "BRL",
    });
    window.location.href = KIWIFY_CHECKOUT_URL;
  }

  const destaques = PREMIUM_FEATURES.slice(0, 3);
  const restantes = PREMIUM_FEATURES.slice(3);

  return (
    <main className="relative min-h-[100dvh]" style={{ color: C.navy }}>
      <style dangerouslySetInnerHTML={{ __html: PLANO_CSS }} />
      {/* Base creme fica ABAIXO do canvas 3D, senão o fundo some atrás dela. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20" style={{ background: C.cream }} />
      {/* Luz quente no topo + sombra fria à direita: dá volume ao creme. */}
      <div aria-hidden className="pl-luz" />
      <PlanoBackground3D />

      {/* 1. Hero */}
      <section className="relative mx-auto max-w-3xl px-6 pb-20 pt-16 sm:pt-24">
        <Reveal>
          <span
            className="inline-block rounded-full border px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wide"
            style={{ borderColor: C.line, color: C.goldLabel, background: "rgba(255,255,255,.82)" }}
          >
            Dra. Gabriela Rosado · Nutricionista · CRN 10582
          </span>
        </Reveal>
        <Reveal delay={1}>
          <h1
            className="mt-6 text-[34px] leading-[1.1] sm:text-[52px]"
            style={{ fontFamily: "Georgia, serif", fontWeight: 600 }}
          >
            Você não falhou. Te deram a <em className="pl-em">ferramenta errada</em>.
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed sm:text-[19px]" style={{ color: C.navySoft }}>
            Lipedema não é gordura comum e não responde a dieta comum. Quanto mais restrição, mais
            inflamação, e é por isso que a balança desce e a perna fica igual. O caminho é outro.
          </p>
        </Reveal>
        <Reveal delay={3}>
          <button
            type="button"
            onClick={() => irParaCheckout("hero")}
            className="pl-btn-gold mt-9 w-full rounded-full px-8 py-5 text-[17px] font-semibold sm:w-auto"
          >
            Quero começar por R$67
          </button>

          <p className="mt-4 text-[13px]" style={{ color: C.navySoft }}>
            pagamento único · sem assinatura · 7 dias de garantia
          </p>
        </Reveal>
      </section>

      {/* 2. Espelho */}
      <section className="relative px-4 py-6">
        <div className="pl-espelho mx-auto max-w-3xl rounded-3xl px-7 py-12 sm:px-12">

          <Reveal>
            <h2
              className="text-[26px] leading-snug sm:text-[32px]"
              style={{ fontFamily: "Georgia, serif", color: "#fff" }}
            >
              Se você chegou até aqui, provavelmente:
            </h2>
          </Reveal>
          <ul className="mt-8 space-y-5">
            {ESPELHO.map((frase, i) => (
              <Reveal key={frase} delay={(Math.min(i, 4) as 0 | 1 | 2 | 3 | 4)}>
                <li className="flex gap-3 text-[17px] leading-relaxed" style={{ color: "#DCE6EF" }}>
                  <span aria-hidden style={{ color: C.goldLight }}>
                    —
                  </span>
                  {frase}
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={4}>
            <p className="mt-9 text-[19px] font-semibold" style={{ color: C.goldLight }}>
              Nada disso é falta de esforço seu.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 3. Por que a dieta falhou */}
      <section className="relative mx-auto max-w-3xl px-6 py-20">
        <Reveal>
          <h2 className="text-[26px] leading-snug sm:text-[32px]" style={{ fontFamily: "Georgia, serif" }}>
            Por que a dieta falhou
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              t: "Restrição aumenta a inflamação",
              d: "O tecido do lipedema é inflamatório. Cortar comida demais joga o corpo em alerta e a perna incha mais.",
            },
            {
              t: "Restrição vira compulsão",
              d: "Depois de dias segurando, o corpo cobra. Não é falta de força de vontade, é fisiologia.",
            },
            {
              t: "Restrição derruba a energia",
              d: "Sem energia não tem rotina que se sustente, e aí começa de novo o ciclo do recomeço.",
            },
          ].map((item, i) => (
            <Reveal key={item.t} delay={(i as 0 | 1 | 2)}>
              <div
                className="h-full rounded-2xl border p-6"
                style={{ borderColor: C.line, background: "rgba(255,255,255,.75)" }}
              >
                <h3 className="text-[17px] font-semibold">{item.t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.navySoft }}>
                  {item.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 4. As 4 semanas */}
      <section className="relative mx-auto max-w-3xl px-6 pb-20">
        <Reveal>
          <h2 className="text-[26px] leading-snug sm:text-[32px]" style={{ fontFamily: "Georgia, serif" }}>
            Uma refeição por semana. Quatro semanas.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SEMANAS.map((s, i) => (
            <Reveal key={s.n} delay={(Math.min(i, 4) as 0 | 1 | 2 | 3 | 4)}>
              <div
                className="h-full rounded-2xl border p-6"
                style={{ borderColor: C.line, background: "rgba(255,255,255,.75)" }}
              >
                <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: C.gold }}>
                  Semana {s.n}
                </span>
                <h3 className="mt-2 text-[19px] font-semibold">{s.titulo}</h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: C.navySoft }}>
                  {s.texto}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 5. Entregáveis */}
      <section className="relative mx-auto max-w-5xl px-6 pb-20">
        <Reveal>
          <h2 className="text-[26px] leading-snug sm:text-[32px]" style={{ fontFamily: "Georgia, serif" }}>
            O que você recebe hoje
          </h2>
        </Reveal>

        <div className="mt-10 space-y-16">
          {destaques.map((f, i) => (
            <div
              key={f.id}
              className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 === 1 ? "md:[direction:rtl]" : ""}`}
            >
              <Reveal className="md:[direction:ltr]">
                <FotoZoom src={f.foto} alt={f.fotoAlt} />
              </Reveal>
              <Reveal delay={1} className="md:[direction:ltr]">
                <div>
                  <f.icone className="h-7 w-7" style={{ color: C.gold }} aria-hidden />
                  <h3 className="mt-4 text-[24px] leading-snug" style={{ fontFamily: "Georgia, serif" }}>
                    {f.titulo}
                  </h3>
                  <p className="mt-3 text-[16px] leading-relaxed" style={{ color: C.navySoft }}>
                    {f.descricao}
                  </p>
                </div>
              </Reveal>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {restantes.map((f, i) => (
            <Reveal key={f.id} delay={(Math.min(i, 4) as 0 | 1 | 2 | 3 | 4)}>
              <div
                className="flex h-full gap-4 rounded-2xl border p-5"
                style={{ borderColor: C.line, background: "rgba(255,255,255,.75)" }}
              >
                <f.icone className="mt-1 h-5 w-5 shrink-0" style={{ color: C.gold }} aria-hidden />
                <div>
                  <h3 className="text-[16px] font-semibold">{f.titulo}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed" style={{ color: C.navySoft }}>
                    {f.descricao}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 6. Gabriela */}
      <section className="relative mx-auto max-w-3xl px-6 pb-20">
        <Reveal>
          <div
            className="flex flex-col items-center gap-6 rounded-3xl border p-7 sm:flex-row sm:items-start"
            style={{ borderColor: C.line, background: "rgba(255,255,255,.8)" }}
          >
            <img
              src={gabiPortrait.url}
              alt="Dra. Gabriela Rosado, nutricionista especialista em lipedema"
              loading="lazy"
              className="h-28 w-28 shrink-0 rounded-full object-cover"
            />
            <div>
              <h2 className="text-[22px]" style={{ fontFamily: "Georgia, serif" }}>
                Quem te acompanha
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.navySoft }}>
                Gabriela Rosado é nutricionista (CRN 10582) e atende mulheres com lipedema. Este plano
                é o mesmo caminho que ela usa no consultório para as primeiras semanas: ajustar uma
                refeição por vez, sem restrição, até a rotina parar de doer.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 7. Preço */}
      <section className="relative px-4 pb-20">
        <div className="mx-auto max-w-3xl rounded-3xl px-7 py-12 sm:px-12" style={{ background: C.navy }}>
          <Reveal>
            <p className="text-[15px] line-through" style={{ color: "#8FA7BC" }}>
              De R$119,90
            </p>
            <p className="mt-1 text-[52px] font-semibold leading-none" style={{ color: "#fff" }}>
              R$<PrecoAnimado />
            </p>
            <p className="mt-2 text-[14px]" style={{ color: "#CBD9E6" }}>
              pagamento único · sem assinatura
            </p>
          </Reveal>
          <ul className="mt-8 space-y-3">
            {PREMIUM_FEATURES.map((f, i) => (
              <Reveal key={f.id} delay={(Math.min(i, 4) as 0 | 1 | 2 | 3 | 4)}>
                <li className="flex gap-3 text-[15px] leading-relaxed" style={{ color: "#DCE6EF" }}>
                  <Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: C.goldLight }} aria-hidden />
                  {f.titulo}
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={2}>
            <button
              type="button"
              onClick={() => irParaCheckout("oferta")}
              className="mt-9 w-full rounded-full px-8 py-5 text-[17px] font-semibold"
              style={{ background: C.goldLight, color: "#22140A" }}
            >
              Começar meu plano de 30 dias
            </button>
            <p className="mt-5 flex items-center justify-center gap-2 text-[14px]" style={{ color: "#CBD9E6" }}>
              <ShieldCheck className="h-4 w-4" style={{ color: C.goldLight }} aria-hidden />
              7 dias de garantia. Não serviu, devolvemos.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="relative mx-auto max-w-3xl px-6 pb-20">
        <Reveal>
          <h2 className="text-[26px] sm:text-[32px]" style={{ fontFamily: "Georgia, serif" }}>
            Perguntas que sempre chegam
          </h2>
        </Reveal>
        <div className="mt-8 space-y-3">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={(Math.min(i, 4) as 0 | 1 | 2 | 3 | 4)}>
              <details
                className="group rounded-2xl border p-5"
                style={{ borderColor: C.line, background: "rgba(255,255,255,.75)" }}
              >
                <summary className="cursor-pointer list-none text-[16px] font-semibold">{item.q}</summary>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.navySoft }}>
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 9. Rodapé */}
      <footer className="relative px-6 pb-36 pt-4">
        <p className="mx-auto max-w-3xl text-[12px] leading-relaxed" style={{ color: C.navySoft }}>
          Gabriela Rosado · Nutricionista · CRN 10582. Conteúdo educativo de nutrição. Não substitui
          consulta, diagnóstico ou tratamento médico individualizado.
        </p>
      </footer>

      {/* 10. Barra fixa */}
      <div
        className="fixed inset-x-0 bottom-0 z-[90] border-t px-4 py-3 backdrop-blur"
        style={{
          borderColor: C.line,
          background: "rgba(251,247,238,.94)",
          transform: barraVisivel ? "translateY(0)" : "translateY(120%)",
          transition: "transform .5s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <div className="hidden sm:block">
            <p className="text-[13px]" style={{ color: C.navySoft }}>
              Plano Zero Lipedema · 30 dias
            </p>
            <p className="text-[17px] font-semibold">R$67 à vista</p>
          </div>
          <button
            type="button"
            onClick={() => irParaCheckout("barra")}
            className="ml-auto w-full rounded-full px-6 py-4 text-[16px] font-semibold sm:w-auto"
            style={{ background: C.navy, color: "#fff" }}
          >
            Quero meu plano por R$67
          </button>
        </div>
      </div>

      {sessao && (
        <MapaPopup sessao={sessao} open={popupAberto} onClose={() => setPopupAberto(false)} />
      )}
    </main>
  );
}
