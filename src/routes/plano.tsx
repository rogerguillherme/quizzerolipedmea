import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Check, ChevronDown, Flame, Activity, Clock, Droplets, CircleSlash, RotateCw } from "lucide-react";
import { PlanoBackground3D } from "@/components/PlanoBackground3D";
import { MapaPopup } from "@/components/MapaPopup";
import { DepoimentosWhatsapp } from "@/components/DepoimentosWhatsapp";
import { KIWIFY_CHECKOUT_URL } from "@/components/OfertaPremiumInline";
import { PREMIUM_FEATURES } from "@/lib/premium-features";
import { lerMapaSessao, mapaJaEnviado, type MapaSessao } from "@/lib/mapa-sessao";
import { track } from "@/lib/analytics";
import { trackMeta } from "@/lib/meta-track";

/** Fotos da Gabriela hospedadas no bucket público `marketing`. */
const FOTOS_BASE =
  "https://gwvlsnpfwvziejranzyl.supabase.co/storage/v1/object/public/marketing/premium/";

export const Route = createFileRoute("/plano")({
  component: PlanoPage,
  head: () => ({
    meta: [
      { title: "Plano Zero Lipedema · 30 dias com a Dra. Gabriela Rosado" },
      {
        name: "description",
        content:
          "Lipedema não responde a dieta comum. Veja o plano de 30 dias da nutricionista Gabriela Rosado (CRN 10582) por R$67, pagamento único e 7 dias de garantia.",
      },
      { property: "og:title", content: "Plano Zero Lipedema · 30 dias" },
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
 * Não reaproveitar em outras rotas: aqui o alvo é brilho, não sobriedade.
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
/* Hero.
   No celular a foto é retrato vertical e não sobra faixa lateral: qualquer
   sobreposição cai em cima do rosto. Por isso o mobile é COLUNA (foto em cima,
   texto embaixo sobre #05131F) e só a partir de 900px a foto vira fundo com
   véu horizontal. */
.pl-hero{
  position:relative;
  background:#05131F; /* legível enquanto a foto não chega */
  overflow:hidden;
}
.pl-hero-foto{
  position:relative;
  width:100%;
  height:clamp(300px,48vh,440px);
}
.pl-hero-img{
  position:absolute; inset:0; width:100%; height:100%;
  object-fit:cover; object-position:50% 18%;
  filter:saturate(1.08) contrast(1.04);
}
/* Degradê só na base da foto: funde com o fundo escuro sem tocar o rosto. */
.pl-hero-fade{
  position:absolute; left:0; right:0; bottom:0; height:55%;
  pointer-events:none;
  background:linear-gradient(to top,#05131F 0%,rgba(5,19,31,.86) 34%,transparent 100%);
}
.pl-hero-veu{ display:none; }
.pl-hero-texto{ max-width:34ch; }

@media (min-width:900px){
  .pl-hero{ min-height:min(94vh,860px); display:flex; align-items:flex-end; }
  .pl-hero-foto{ position:absolute; inset:0; height:100%; }
  .pl-hero-img{ object-position:78% 14%; }
  .pl-hero-fade{ display:none; }
  /* Véu horizontal: escurece a esquerda (onde mora o texto) e libera o rosto. */
  .pl-hero-veu{
    display:block;
    position:absolute; inset:0; pointer-events:none;
    background:
      radial-gradient(90% 70% at 92% 6%, rgba(250,228,168,.28), transparent 58%),
      linear-gradient(to top, rgba(5,19,31,.85) 0%, rgba(5,19,31,.28) 26%, transparent 52%),
      linear-gradient(to right, #05131F 0%, rgba(5,19,31,.94) 34%, rgba(9,32,54,.55) 52%, transparent 72%);
  }
  .pl-hero-texto{ max-width:21ch; }
  .pl-hero-wrap{ max-width:72rem; padding-bottom:5rem; padding-top:7rem; }
}

.pl-selo-escuro{
  background:rgba(9,26,43,.55);
  border:1px solid rgba(239,201,107,.55);
  backdrop-filter:blur(6px);
  box-shadow:0 10px 26px -18px rgba(0,0,0,.9);
}
/* Ciclo da inflamação */
.pl-pastilha{
  display:grid; place-items:center;
  width:44px; height:44px; border-radius:14px;
  background:linear-gradient(180deg,#FBEBC4 0%,#F2D68F 100%);
  border:1px solid rgba(192,135,42,.45);
  color:#8A6224;
  box-shadow:0 1px 0 rgba(255,255,255,.9) inset, 0 10px 20px -16px rgba(192,135,42,1);
}
.pl-gira{ animation:pl-spin 9s linear infinite; }
@keyframes pl-spin{ to{ transform:rotate(360deg); } }
.pl-selo{
  background:linear-gradient(180deg,#FFFFFF 0%,#FBF6EC 100%);
  border:1px solid rgba(192,135,42,.45);
  box-shadow:0 1px 0 rgba(255,255,255,.95) inset, 0 8px 18px -14px rgba(18,48,80,.5);
}

@media (prefers-reduced-motion: reduce){
  .pl-gira{ animation:none; }
  .pl-btn-gold::after{ animation:none; opacity:0; }
  .pl-btn-gold{ transition:none; }
}
`;


/** Etapas do ciclo inflamatório: mecanismo que a leitora consegue visualizar. */
const CICLO = [
  {
    n: "01",
    icone: Flame,
    t: "A gordura da perna inflama",
    d: "Não é gordura comum. É um tecido inflamado que segura líquido. Por isso ele não responde como o resto do corpo.",
  },
  {
    n: "02",
    icone: Activity,
    t: "A perna dói e pesa",
    d: "Dói ao toque, incha ao longo do dia e no fim da tarde a calça marca. Roxo aparece sem você ter batido em nada.",
  },
  {
    n: "03",
    icone: Clock,
    t: "Você se mexe menos",
    d: "Quem sente dor anda menos, evita escada, desiste da academia. E é a panturrilha que empurra o líquido de volta para cima.",
  },
  {
    n: "04",
    icone: Droplets,
    t: "O líquido acumula",
    d: "Circulação e sistema linfático ficam mais lentos. Incha mais, dói mais, e a perna amanhece pesada mesmo depois de dormir.",
  },
  {
    n: "05",
    icone: CircleSlash,
    t: "Você corta a comida",
    d: "Passa fome, emagrece o rosto e o busto, e a perna quase não muda. Só que a restrição eleva o cortisol, traz compulsão e cansaço…",
  },
] as const;

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
  "De manhã a perna já acordou pesada, mesmo você tendo dormido.",
  "No fim da tarde a calça marcou, e você trocou de roupa.",
  "Alguém já te disse que era só fechar a boca e caminhar mais.",
  "Você emagreceu de verdade em algum momento, e a perna continuou igual.",
  "Já gastou com chá, drenagem, dieta e academia.",
  "E toda segunda-feira você recomeça.",
];


const SEMANAS = [
  {
    n: 1,
    rotulo: "Fase 1 · café da manhã",
    titulo: "O hábito mais automático",
    texto: "Como você abre o dia define a inflamação das horas seguintes. É a troca mais fácil de sustentar, e onde vem o primeiro alívio.",
  },
  {
    n: 2,
    rotulo: "Fase 2 · almoço",
    titulo: "A maior carga do dia",
    texto: "É a refeição que mais carrega inflamação. Muda o que vai no prato, não o quanto. E a perna começa a pesar menos à tarde.",
  },
  {
    n: 3,
    rotulo: "Fase 3 · lanche",
    titulo: "Onde a rotina quebra",
    texto: "Essa fase não se ganha na força de vontade, se ganha com duas opções prontas antes de a fome chegar.",
  },
  {
    n: 4,
    rotulo: "Fase 4 · jantar",
    titulo: "Como você vai acordar",
    texto: "É o que decide o inchaço e o peso nas pernas da manhã seguinte. Fechando essa fase, o novo padrão já virou rotina.",
  },
];

const FAQ = [
  {
    q: "Isso é mais uma dieta?",
    a: "Não. Não tem contagem de caloria, não tem pesagem de comida, não tem lista de proibições e nenhuma refeição é pulada. É um plano de hábitos: o que muda é o que alimenta a inflamação, não o quanto você come.",
  },
  {
    q: "Vou conseguir manter?",
    a: "É por isso que são quatro fases e não uma virada de chave. Na primeira fase você mexe em um único hábito, e o resto do seu dia continua igual. A maioria das mulheres não falha no método, falha na manutenção: por isso o plano foi desenhado para sustentar.",
  },
  {
    q: "Em quanto tempo eu sinto diferença?",
    a: "Varia de pessoa para pessoa. O que a maioria relata primeiro é a perna amanhecer menos pesada e a calça marcar menos no fim do dia: sinais de inchaço, não de peso. Não é resultado garantido e não substitui acompanhamento médico.",
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
  const [precoEmDestaque, setPrecoEmDestaque] = useState(false);
  const precoRef = useRef<HTMLElement>(null);

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

  function irParaCheckout(origem: "hero" | "ciclo" | "oferta" | "barra" | "popup") {
    track("checkout_view", { origem, valor: 67 });
    trackMeta("InitiateCheckout", {
      content_name: "Plano Zero Lipedema 30d",
      content_type: "product",
      value: 67,
      currency: "BRL",
    });
    window.location.href = KIWIFY_CHECKOUT_URL;
  }

  /** Popup → preço: fecha, rola até o bloco e pisca o destaque por 2s. */
  function verFasesDoPopup() {
    track("checkout_view", { origem: "popup", valor: 67 });
    setPopupAberto(false);
    setPrecoEmDestaque(true);
    window.setTimeout(() => {
      precoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    window.setTimeout(() => setPrecoEmDestaque(false), 2600);
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

      {/* 1. Hero. Celular: foto em cima, texto embaixo. Desktop: foto ao fundo. */}
      <section className="pl-hero">
        <div className="pl-hero-foto">
          <img
            src={`${FOTOS_BASE}gabriela-retrato.jpg`}
            alt="Dra. Gabriela Rosado, nutricionista especialista em lipedema"
            width={760}
            height={950}
            fetchPriority="high"
            className="pl-hero-img"
          />
          <div aria-hidden className="pl-hero-fade" />
        </div>
        <div aria-hidden className="pl-hero-veu" />

        <div className="pl-hero-wrap relative mx-auto w-full max-w-3xl px-6 pb-14 pt-10">

          <Reveal>
            <span
              className="pl-selo-escuro inline-block rounded-full px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wide"
              style={{ color: C.goldGlow }}
            >
              Dra. Gabriela Rosado · Nutricionista · CRN 10582
            </span>
          </Reveal>
          <Reveal delay={1}>
            <h1
              className="pl-hero-texto mt-5 text-[34px] leading-[1.08] sm:text-[52px]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, color: "#FFFDF6" }}
            >
              Não é peso. É <em className="pl-em">inflamação</em> que se retroalimenta.
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p
              className="pl-hero-texto mt-5 text-[17px] leading-relaxed sm:text-[19px]"
              style={{ color: "rgba(255,253,246,.86)" }}
            >
              É por isso que você emagrece e a perna continua doendo. Não é falta de disciplina: é um
              ciclo que dieta não quebra, e ele tem um ponto de saída.
            </p>
          </Reveal>
          <Reveal delay={3}>
            <button
              type="button"
              onClick={() => irParaCheckout("hero")}
              className="pl-btn-gold mt-8 w-full rounded-full px-8 py-5 text-[17px] font-semibold sm:w-auto"
            >
              Quero quebrar esse ciclo
            </button>
            <p className="mt-4 text-[13px]" style={{ color: "rgba(255,253,246,.72)" }}>
              R$67 · pagamento único
            </p>
            <p className="mt-1 text-[13px]" style={{ color: "rgba(255,253,246,.72)" }}>
              7 dias de garantia. Não serviu, você me chama e eu devolvo.
            </p>
            <p
              className="mt-8 flex items-center gap-2 text-[12px] uppercase tracking-[.18em]"
              style={{ color: "rgba(255,253,246,.6)" }}
            >
              <ChevronDown size={16} aria-hidden />
              entenda o ciclo
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2. Espelho */}
      <section className="relative px-4 py-6">
        <div className="pl-espelho mx-auto max-w-3xl rounded-3xl px-7 py-12 sm:px-12">

          <Reveal>
            <h2
              className="text-[26px] leading-snug sm:text-[32px]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#fff" }}
            >
              Eu sei mais ou menos como foi o seu dia hoje.
            </h2>
          </Reveal>
          <ul className="mt-8 space-y-5">
            {ESPELHO.map((frase, i) => (
              <Reveal key={frase} delay={(Math.min(i, 4) as 0 | 1 | 2 | 3 | 4)}>
                <li className="flex gap-3 text-[17px] leading-relaxed" style={{ color: "#DCE6EF" }}>
                  <span
                    aria-hidden
                    className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full"
                    style={{ background: "#EFC96B" }}
                  />
                  {frase}
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={4}>
            <p className="mt-9 text-[18px] font-semibold leading-relaxed" style={{ color: C.goldLight }}>
              Se eu acertei em três dessas, você não está com preguiça. Você está com lipedema, e ele
              não responde ao que te mandaram fazer.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 3. O ciclo da inflamação: mecanismo antes da oferta. */}
      <section className="relative mx-auto max-w-5xl px-6 py-20">
        <Reveal>
          <h2 className="text-[26px] leading-snug sm:text-[34px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Por que quanto mais você tenta, <em className="pl-em">pior fica</em>
          </h2>
        </Reveal>
        <Reveal delay={1}>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed" style={{ color: C.navySoft }}>
            O lipedema não é um problema parado. É uma roda girando, e cada volta deixa a próxima mais
            difícil.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {CICLO.map((etapa, i) => (
            <Reveal key={etapa.n} delay={(Math.min(i, 4) as 0 | 1 | 2 | 3 | 4)}>
              <div className="pl-card flex h-full gap-4 rounded-2xl p-6">
                <span className="pl-pastilha shrink-0" aria-hidden>
                  <etapa.icone size={22} strokeWidth={1.6} />
                </span>
                <div>
                  <span className="text-[12px] font-semibold tracking-[.18em]" style={{ color: C.goldLabel }}>
                    {etapa.n}
                  </span>
                  <h3 className="mt-1 text-[19px] leading-snug" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {etapa.t}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed" style={{ color: C.navySoft }}>
                    {etapa.d}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}

          <Reveal className="md:col-span-2">
            <div
              className="flex items-center gap-5 rounded-2xl p-6"
              style={{
                background: "linear-gradient(135deg,#FBEBC4 0%,#F5DFA4 100%)",
                border: "1px solid rgba(192,135,42,.45)",
                boxShadow: "0 1px 0 rgba(255,255,255,.9) inset, 0 18px 34px -28px rgba(192,135,42,1)",
              }}
            >
              <RotateCw size={30} strokeWidth={1.6} aria-hidden className="pl-gira shrink-0" style={{ color: C.gold }} />
              <p className="text-[16px] leading-relaxed" style={{ color: "#5C4113" }}>
                <strong style={{ color: "#4A340E" }}>…e isso inflama de novo.</strong> A roda dá mais uma
                volta, um pouco pior que a anterior. É por isso que você sente que está sempre recomeçando
                do zero.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <div className="pl-espelho mt-6 rounded-3xl px-7 py-10 sm:px-10">
            <h3 className="text-[24px] leading-snug sm:text-[28px]" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#fff" }}>
              Não na força de vontade. Na <em className="pl-em">inflamação</em>.
            </h3>
            <p className="mt-5 text-[16px] leading-relaxed" style={{ color: "#DCE6EF" }}>
              Dieta restritiva ataca o passo 5 e alimenta o passo 1. Por isso falha. O que interrompe a
              roda é reduzir a carga inflamatória da comida, mantendo você satisfeita e com energia para
              voltar a se mexer.
            </p>
            <p className="mt-5 text-[17px] font-semibold leading-relaxed" style={{ color: C.goldLight }}>
              <strong>Quatro fases, um hábito por vez.</strong> Você não vai cortar comida. Vai trocar o
              que alimenta a inflamação, começando pelo hábito mais fácil de mudar.
            </p>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div className="pl-card mt-6 rounded-3xl px-7 py-9 sm:px-10">
            <h3
              className="text-[22px] leading-snug sm:text-[26px]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              A roda não para sozinha.
            </h3>
            <p className="mt-4 text-[16px] leading-relaxed" style={{ color: C.navySoft }}>
              Cada semana que passa é mais uma volta: mais líquido retido, mais dor, mais dificuldade
              de voltar a se mexer. Não existe pressa artificial nenhuma aqui. Existe o fato de que
              quanto mais cedo a inflamação cede, menos fundo o ciclo cava.
            </p>
            <button
              type="button"
              onClick={() => irParaCheckout("ciclo")}
              className="pl-btn-gold mt-7 w-full rounded-full px-8 py-4 text-[16px] font-semibold sm:w-auto"
            >
              Quero começar pela fase 1
            </button>
            <p className="mt-3 text-[13px]" style={{ color: C.navySoft }}>
              7 dias de garantia. Não serviu, você me chama e eu devolvo.
            </p>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div className="mx-auto mt-12 max-w-xl text-center">
            <p
              className="text-[20px] leading-relaxed"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: C.navy }}
            >
              Eu preciso te dizer uma coisa que talvez ninguém tenha dito ainda:{" "}
              <strong>você não fez nada errado.</strong>
            </p>
            <p className="mt-5 text-[16px] leading-relaxed" style={{ color: C.navySoft }}>
              Cada passo desse ciclo é uma reação normal do seu corpo a um problema que te explicaram
              errado.
            </p>
          </div>
        </Reveal>

      </section>

      {/* 4. As 4 fases */}
      <section className="relative mx-auto max-w-3xl px-6 pb-20">
        <Reveal>
          <h2 className="text-[26px] leading-snug sm:text-[32px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Quatro fases. <em className="pl-em">Nenhuma restrição.</em>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed" style={{ color: C.navySoft }}>
            Não é dieta. É um planejamento em quatro fases para moldar, um de cada vez, os hábitos que
            alimentam a inflamação. Você não corta comida. Troca o que inflama pelo que desinflama.
          </p>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.navySoft, opacity: 0.85 }}>
            O objetivo nunca foi a balança. É menos dor, menos inchaço e menos peso nas pernas.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SEMANAS.map((s, i) => (
            <Reveal key={s.n} delay={(Math.min(i, 4) as 0 | 1 | 2 | 3 | 4)}>
              <div className="pl-card h-full rounded-2xl p-6">
                <span className="pl-semana-num">{s.rotulo}</span>
                <h3 className="mt-2 text-[19px] font-semibold">{s.titulo}</h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: C.navySoft }}>
                  {s.texto}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={2}>
          <p className="mt-8 text-[16px] leading-relaxed" style={{ color: C.navySoft }}>
            Ao fim das quatro fases, nada foi proibido e nenhuma refeição foi pulada. O que mudou foi o
            que alimenta a inflamação.
          </p>
        </Reveal>
      </section>

      {/* 5. Entregáveis */}
      <section className="relative mx-auto max-w-5xl px-6 pb-20">
        <Reveal>
          <h2 className="text-[26px] leading-snug sm:text-[32px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            O que entra no seu celular hoje
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
                  <h3 className="mt-4 text-[24px] leading-snug" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
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
                className="pl-card flex h-full gap-4 rounded-2xl p-5"
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

      {/* 5b. Prova social: desligada até haver print real (ver REAIS). */}
      <DepoimentosWhatsapp navy={C.navy} navySoft={C.navySoft} goldLabel={C.goldLabel} />

      {/* 6. Gabriela */}

      <section className="relative mx-auto max-w-3xl px-6 pb-20">
        <Reveal>
          <div className="pl-card flex flex-col items-center gap-7 rounded-3xl p-7">
            <div
              className="pl-foto pl-foto-grande w-full max-w-[380px] overflow-hidden"
              style={{ aspectRatio: "1 / 1", borderRadius: 22, background: C.creamDeep }}
            >
              <img
                src={`${FOTOS_BASE}gabriela-quadrada.jpg`}
                alt="Dra. Gabriela Rosado, nutricionista especialista em lipedema"
                loading="lazy"
                width={640}
                height={640}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-[22px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Por que eu montei isso
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.navySoft }}>
                Eu atendo mulheres com lipedema todos os dias. A frase que eu mais escuto é "eu já
                tentei de tudo".
              </p>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.navySoft }}>
                Quase sempre ela vem de alguém que se esforçou de verdade, emagreceu, e mesmo assim
                continuou com a perna doendo. O problema nunca foi o esforço dela. Foi o tratamento,
                que tratava gordura comum.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.navySoft }}>
                A Rotina Zero Lipedema é o mesmo caminho que eu uso nas primeiras semanas de
                consultório: um hábito por vez, sem restrição, até a inflamação ceder.
              </p>
              <p className="mt-5 text-[13px] font-semibold" style={{ color: C.goldLabel }}>
                Gabriela Rosado · Nutricionista · CRN 10582
              </p>
            </div>

          </div>
        </Reveal>
      </section>

      {/* 6b. Como costuma ser o dia 30 */}
      <section className="relative mx-auto max-w-4xl px-6 pb-20">
        <Reveal>
          <h2 className="text-[26px] leading-snug sm:text-[32px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Como costuma ser o <em className="pl-em">dia 30</em>
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed" style={{ color: C.navySoft }}>
            A maioria das mulheres relata, nessa ordem: a perna amanhecendo mais leve, a calça
            marcando menos no fim do dia, e a vontade de doce à tarde diminuindo sozinha.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {DIA30.map((c, i) => (
            <Reveal key={c.t} delay={(Math.min(i, 4) as 0 | 1 | 2 | 3 | 4)}>
              <div className="pl-card h-full rounded-2xl p-5">
                <c.icone className="h-6 w-6" style={{ color: C.gold }} aria-hidden />
                <h3 className="mt-3 text-[17px] font-semibold">{c.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: C.navySoft }}>
                  {c.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={2}>
          <p className="mt-6 text-[14px] leading-relaxed" style={{ color: C.navySoft, opacity: 0.9 }}>
            Não é promessa e não vale para todo mundo. É o que aparece com mais frequência quando a
            inflamação começa a ceder.
          </p>
        </Reveal>
      </section>

      {/* 7. Preço */}
      <section ref={precoRef} className="relative px-4 pb-20">
        <div
          className="pl-preco mx-auto max-w-3xl rounded-3xl px-7 py-12 sm:px-12"
          style={
            precoEmDestaque
              ? { boxShadow: "0 0 0 3px rgba(239,201,107,.85), 0 0 70px -10px rgba(239,201,107,.6)" }
              : undefined
          }
        >
          <Reveal>
            <h2
              className="mb-6 text-[26px] leading-snug sm:text-[30px]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#FFFDF6" }}
            >
              Comece hoje pela <em className="pl-em">primeira fase</em>
            </h2>
            <p className="mb-4 text-[15px] leading-relaxed" style={{ color: "#CBD9E6" }}>
              Uma sessão de drenagem sai entre R$100 e R$150. Uma consulta particular, entre R$300 e
              R$400. Um mês de chá e suplemento sem orientação, mais que isso.
            </p>
            <p className="mb-4 text-[17px] font-semibold leading-relaxed" style={{ color: C.goldLight }}>
              O plano completo, uma vez só: R$67.
            </p>
            <p className="text-[15px] line-through" style={{ color: "#8FA7BC" }}>
              De R$119,90
            </p>
            <p className="pl-price mt-1 text-[52px] font-semibold leading-none">
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
              className="pl-btn-gold mt-9 w-full rounded-full px-8 py-5 text-[17px] font-semibold"
            >
              Começar meu plano de 30 dias
            </button>
            <p className="mt-5 flex items-center justify-center gap-2 text-[14px]" style={{ color: "#CBD9E6" }}>
              <ShieldCheck className="h-4 w-4" style={{ color: C.goldLight }} aria-hidden />
              7 dias de garantia. Não serviu, você me chama e eu devolvo.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="relative mx-auto max-w-3xl px-6 pb-20">
        <Reveal>
          <h2 className="text-[26px] sm:text-[32px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Perguntas que sempre chegam
          </h2>
        </Reveal>
        <div className="mt-8 space-y-3">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={(Math.min(i, 4) as 0 | 1 | 2 | 3 | 4)}>
              <details
                className="pl-card group rounded-2xl p-5"
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
          background: "rgba(251,246,236,.94)",
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
          <div className="ml-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => irParaCheckout("barra")}
              className="pl-btn-gold w-full rounded-full px-6 py-4 text-[16px] font-semibold sm:w-auto"
            >
              Quero meu plano por R$67
            </button>
            <p className="mt-1.5 text-center text-[11px]" style={{ color: C.navySoft }}>
              7 dias de garantia. Não serviu, você me chama e eu devolvo.
            </p>
          </div>
        </div>
      </div>

      {sessao && (
        <MapaPopup
          sessao={sessao}
          open={popupAberto}
          onClose={() => setPopupAberto(false)}
          onVerFases={verFasesDoPopup}
        />
      )}
    </main>
  );
}
