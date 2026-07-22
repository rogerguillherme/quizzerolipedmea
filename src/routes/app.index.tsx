import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  Utensils,
  Droplets,
  Footprints,
  HeartHandshake,
  Loader2,
  ArrowRight,
  MessageCircle,
  Lock,
  Sparkles,
  X,
  Play,
  Crown,
  Salad,
  Activity,
  BookOpen,
} from "lucide-react";
import { getMyProfile } from "@/lib/mapa-access.functions";
import type { Diagnostico } from "@/lib/mapa.functions";

export const Route = createFileRoute("/app/")({
  component: GuiaMapa,
  head: () => ({
    meta: [
      { title: "Meu Mapa · Zero Lipedema" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function GuiaMapa() {
  const fetchProfile = useServerFn(getMyProfile);
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Loader2 className="size-6 animate-spin" style={{ color: "#16324F" }} />
      </div>
    );
  }

  const nome = String((profile as any)?.nome ?? "").split(" ")[0] || "linda";
  const diagnostico = ((profile as any)?.diagnostico as Diagnostico | null) ?? null;
  const estagio = diagnostico?.estagio ?? "Indeterminado";
  const prioridades = diagnostico?.prioridades?.slice(0, 3) ?? [];

  return (
    <div className="px-5 pt-6">
      {error && (
        <p className="mb-4 text-center text-[13px]" style={{ color: "#5B5D52" }}>
          Não consegui carregar seu perfil por completo — abaixo está seu guia essencial.
        </p>
      )}

      {/* Hero editorial */}
      <section
        className="relative overflow-hidden rounded-[28px] px-6 py-8 text-[color:var(--cream)]"
        style={{
          background:
            "linear-gradient(160deg, #2C5578 0%, #16324F 55%, #0D2138 100%)",
          boxShadow: "0 24px 40px -28px rgba(22,50,79,0.55)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(217,169,75,0.35), transparent 70%)",
          }}
        />
        <p
          className="text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.28em", color: "#D9A94B" }}
        >
          Bem-vinda de volta
        </p>
        <h1
          className="mt-3"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            fontSize: "1.85rem",
            lineHeight: 1.15,
            letterSpacing: "-0.005em",
            color: "#F5EFE1",
          }}
        >
          <em className="italic" style={{ color: "#D9A94B" }}>{nome}</em>, este é o
          seu mapa.
        </h1>
        <p
          className="mt-3 max-w-[36ch] text-[14.5px]"
          style={{ color: "rgba(245,239,225,0.85)", lineHeight: 1.55 }}
        >
          O que você faz hoje muda o que seu corpo entrega amanhã. Aqui está seu
          próximo passo.
        </p>

        <div
          className="mt-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
          style={{
            background: "rgba(245,239,225,0.14)",
            border: "1px solid rgba(217,169,75,0.35)",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#D9A94B" }} />
          <span className="text-[12px] font-semibold" style={{ color: "#F5EFE1" }}>
            Estágio percebido: <span style={{ color: "#D9A94B" }}>{estagio}</span>
          </span>
        </div>
      </section>

      {/* Prioridades */}
      {prioridades.length > 0 && (
        <section className="mt-8">
          <Eyebrow>Suas 3 prioridades da semana</Eyebrow>
          <div className="mt-3 space-y-2.5">
            {prioridades.map((p, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl px-4 py-3.5"
                style={{
                  background: "rgba(255,253,247,0.9)",
                  border: "1px solid rgba(216,198,160,0.55)",
                  boxShadow:
                    "0 10px 24px -18px rgba(22,50,79,0.35), 0 1px 0 rgba(255,255,255,0.6) inset",
                }}
              >
                <span
                  className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: "rgba(175,127,53,0.1)",
                    border: "1px solid rgba(175,127,53,0.4)",
                    color: "#AF7F35",
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  {i + 1}
                </span>
                <p
                  className="pt-0.5 text-[14.5px]"
                  style={{ color: "#16324F", lineHeight: 1.5 }}
                >
                  {p}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Guias rápidos */}
      <section className="mt-8">
        <Eyebrow>Guias rápidos</Eyebrow>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <GuideCard
            icon={<Utensils className="size-4" />}
            title="Como montar o prato"
            desc="Modelo anti-inflamatório em 3 passos"
          />
          <GuideCard
            icon={<Droplets className="size-4" />}
            title="Hidratação"
            desc="Rotina de água e chás"
          />
          <GuideCard
            icon={<Footprints className="size-4" />}
            title="Movimento"
            desc="20 minutos que cabem no seu dia"
          />
          <GuideCard
            icon={<HeartHandshake className="size-4" />}
            title="Cuidados com a pele"
            desc="Rotina simples pra sensibilidade"
          />
        </div>
      </section>

      {/* CTA protocolo */}
      <section className="mt-8">
        <Link
          to="/app/missoes"
          className="block overflow-hidden rounded-3xl p-6"
          style={{
            background:
              "linear-gradient(150deg, #16324F 0%, #2C5578 60%, #AF7F35 130%)",
            color: "#F5EFE1",
            boxShadow: "0 20px 32px -22px rgba(22,50,79,0.5)",
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase"
            style={{ letterSpacing: "0.28em", color: "rgba(217,169,75,0.9)" }}
          >
            Próximo passo
          </div>
          <h3
            className="mt-2"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              fontSize: "1.4rem",
              lineHeight: 1.2,
            }}
          >
            Iniciar Protocolo de <em className="italic">7 dias</em>
          </h3>
          <p className="mt-2 text-[13.5px]" style={{ color: "rgba(245,239,225,0.85)" }}>
            Uma missão suave por dia, guiada pela Gabriela. Ao final você recebe
            um relatório com o que mudou.
          </p>
          <span
            className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold"
            style={{ background: "rgba(245,239,225,0.18)", color: "#F5EFE1" }}
          >
            Começar agora <ArrowRight className="size-3.5" />
          </span>
        </Link>
      </section>

      {/* Premium bloqueado */}
      <PremiumSection nome={nome} />

      {/* Atalho WhatsApp */}
      <section className="mt-4">
        <Link
          to="/app/whatsapp"
          className="flex items-center gap-3 rounded-2xl p-4"
          style={{
            background: "rgba(255,253,247,0.9)",
            border: "1px solid rgba(216,198,160,0.55)",
          }}
        >
          <span
            className="grid size-10 place-items-center rounded-full"
            style={{
              background: "rgba(175,127,53,0.1)",
              border: "1px solid rgba(175,127,53,0.35)",
              color: "#AF7F35",
            }}
          >
            <MessageCircle className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-[14px] font-semibold" style={{ color: "#16324F" }}>
              Falar com a Gabriela
            </p>
            <p className="text-[12px]" style={{ color: "#5B5D52" }}>
              Tire dúvidas do dia direto pelo WhatsApp
            </p>
          </div>
          <ArrowRight className="size-4" style={{ color: "#5B5D52" }} />
        </Link>
      </section>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[10px] font-semibold uppercase"
        style={{ letterSpacing: "0.24em", color: "#AF7F35" }}
      >
        {children}
      </span>
      <span
        className="h-px flex-1"
        style={{
          background:
            "linear-gradient(90deg, rgba(216,198,160,0.7), transparent)",
        }}
      />
    </div>
  );
}

function GuideCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(255,253,247,0.9)",
        border: "1px solid rgba(216,198,160,0.55)",
        boxShadow: "0 10px 24px -20px rgba(22,50,79,0.3)",
      }}
    >
      <span
        className="grid size-9 place-items-center rounded-full"
        style={{
          background: "rgba(175,127,53,0.1)",
          border: "1px solid rgba(175,127,53,0.4)",
          color: "#AF7F35",
        }}
      >
        {icon}
      </span>
      <p
        className="mt-3 text-[13.5px] font-semibold"
        style={{ color: "#16324F" }}
      >
        {title}
      </p>
      <p className="mt-0.5 text-[11.5px]" style={{ color: "#5B5D52", lineHeight: 1.45 }}>
        {desc}
      </p>
    </div>
  );
}

/* ============= Premium ============= */

const PREMIUM_MODULES = [
  {
    icon: Salad,
    title: "Cardápio Anti-Lipedema · 90 dias",
    desc: "Planos semanais com lista de compras e substituições.",
  },
  {
    icon: Activity,
    title: "Treinos Guiados em Vídeo",
    desc: "Circuitos de baixo impacto para drenagem e força.",
  },
  {
    icon: BookOpen,
    title: "Método Derma · Aulas em vídeo",
    desc: "Aulas da Dra. Gabriela sobre hormônios, sono e inflamação.",
  },
  {
    icon: HeartHandshake,
    title: "Acompanhamento no WhatsApp",
    desc: "Grupo exclusivo + check-in quinzenal com a equipe.",
  },
];

function PremiumSection({ nome }: { nome: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-8">
      <Eyebrow>Zero Lipedema · Premium</Eyebrow>

      <div
        className="relative mt-3 overflow-hidden rounded-3xl"
        style={{
          background:
            "linear-gradient(155deg, #0D2138 0%, #16324F 55%, #1F3F63 100%)",
          border: "1px solid rgba(217,169,75,0.35)",
          boxShadow: "0 24px 40px -28px rgba(13,33,56,0.6)",
        }}
      >
        {/* Header dourado */}
        <div className="flex items-center justify-between px-5 pt-5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase"
            style={{
              letterSpacing: "0.24em",
              background: "rgba(217,169,75,0.15)",
              border: "1px solid rgba(217,169,75,0.45)",
              color: "#D9A94B",
            }}
          >
            <Crown className="size-3" /> Premium
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
            style={{
              letterSpacing: "0.18em",
              background: "rgba(245,239,225,0.1)",
              color: "rgba(245,239,225,0.7)",
            }}
          >
            Bloqueado
          </span>
        </div>

        <h3
          className="mt-3 px-5"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            fontSize: "1.5rem",
            lineHeight: 1.15,
            color: "#F5EFE1",
          }}
        >
          O plano completo para <em className="italic" style={{ color: "#D9A94B" }}>zerar</em> o lipedema.
        </h3>
        <p
          className="mt-2 px-5 text-[13.5px]"
          style={{ color: "rgba(245,239,225,0.78)", lineHeight: 1.55 }}
        >
          Cardápio, treinos, aulas do Método Derma e acompanhamento direto com a
          Dra. Gabriela. Assim que liberar, {nome}, tudo aparece aqui destravado.
        </p>

        {/* Preview dos módulos, com blur */}
        <div className="relative mt-5 px-5 pb-24">
          <div className="grid grid-cols-2 gap-2.5" style={{ filter: "blur(2px)" }}>
            {PREMIUM_MODULES.map((m) => (
              <div
                key={m.title}
                className="rounded-2xl p-3.5"
                style={{
                  background: "rgba(245,239,225,0.08)",
                  border: "1px solid rgba(217,169,75,0.2)",
                }}
              >
                <span
                  className="grid size-8 place-items-center rounded-full"
                  style={{
                    background: "rgba(217,169,75,0.18)",
                    color: "#D9A94B",
                  }}
                >
                  <m.icon className="size-4" />
                </span>
                <p
                  className="mt-2.5 text-[12.5px] font-semibold"
                  style={{ color: "#F5EFE1", lineHeight: 1.25 }}
                >
                  {m.title}
                </p>
                <p
                  className="mt-1 text-[10.5px]"
                  style={{ color: "rgba(245,239,225,0.7)", lineHeight: 1.4 }}
                >
                  {m.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Overlay de bloqueio */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(13,33,56,0) 0%, rgba(13,33,56,0.85) 65%, rgba(13,33,56,0.95) 100%)",
            }}
          />
          <div className="absolute inset-x-5 bottom-5 flex flex-col items-center text-center">
            <span
              className="grid size-11 place-items-center rounded-full"
              style={{
                background: "rgba(217,169,75,0.18)",
                border: "1px solid rgba(217,169,75,0.5)",
                color: "#D9A94B",
              }}
            >
              <Lock className="size-5" />
            </span>
            <p
              className="mt-3 text-[12.5px] font-semibold uppercase"
              style={{ letterSpacing: "0.2em", color: "rgba(245,239,225,0.75)" }}
            >
              Conteúdo bloqueado
            </p>
            <button
              onClick={() => setOpen(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, #D9A94B 0%, #AF7F35 100%)",
                color: "#0D2138",
                boxShadow: "0 12px 24px -12px rgba(217,169,75,0.55)",
              }}
            >
              <Sparkles className="size-4" />
              Desbloquear Premium
            </button>
          </div>
        </div>
      </div>

      {open && <PremiumVideoModal nome={nome} onClose={() => setOpen(false)} />}
    </section>
  );
}

function PremiumVideoModal({
  nome,
  onClose,
}: {
  nome: string;
  onClose: () => void;
}) {
  const [restante, setRestante] = useState(30);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      const passado = Math.floor((Date.now() - startRef.current) / 1000);
      const r = Math.max(0, 30 - passado);
      setRestante(r);
      if (r === 0) window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const desbloqueado = restante === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(9,20,35,0.72)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl"
        style={{
          background: "linear-gradient(180deg, #0D2138 0%, #16324F 100%)",
          border: "1px solid rgba(217,169,75,0.35)",
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full"
          style={{
            background: "rgba(245,239,225,0.15)",
            color: "#F5EFE1",
          }}
        >
          <X className="size-4" />
        </button>

        {/* Video */}
        <div
          className="relative aspect-video w-full"
          style={{ background: "#000" }}
        >
          <video
            src="https://cdn.jsdelivr.net/gh/lovable-community/placeholders@main/gabriela-premium.mp4"
            controls
            autoPlay
            playsInline
            className="h-full w-full object-cover"
            poster="/__l5e/assets-v1/placeholder/gabriela-poster.jpg"
          >
            <track kind="captions" />
          </video>
          <div
            className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase"
            style={{
              letterSpacing: "0.22em",
              background: "rgba(0,0,0,0.55)",
              color: "#D9A94B",
              border: "1px solid rgba(217,169,75,0.5)",
            }}
          >
            <Play className="size-3" /> Dra. Gabriela
          </div>
        </div>

        <div className="px-5 pb-6 pt-5">
          <p
            className="text-[10px] font-semibold uppercase"
            style={{ letterSpacing: "0.28em", color: "#D9A94B" }}
          >
            Como funciona o Premium
          </p>
          <h3
            className="mt-2"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              fontSize: "1.4rem",
              lineHeight: 1.2,
              color: "#F5EFE1",
            }}
          >
            {nome}, assista com atenção — <em className="italic" style={{ color: "#D9A94B" }}>é rápido</em>.
          </h3>
          <p
            className="mt-2 text-[13.5px]"
            style={{ color: "rgba(245,239,225,0.8)", lineHeight: 1.55 }}
          >
            Em menos de 3 minutos, a Dra. Gabriela explica o Método Derma, o que
            você recebe e por que ele funciona para lipedema.
          </p>

          {desbloqueado ? (
            <a
              href="/protocolo/pagamento"
              className="mt-5 flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[14px] font-semibold transition-transform active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, #D9A94B 0%, #AF7F35 100%)",
                color: "#0D2138",
                boxShadow: "0 14px 28px -12px rgba(217,169,75,0.6)",
                animation: "breathe 2.4s ease-in-out infinite",
              }}
            >
              <Sparkles className="size-4" />
              Comprar Plano Premium Zero Lipedema
            </a>
          ) : (
            <div
              className="mt-5 flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[13px] font-semibold"
              style={{
                background: "rgba(245,239,225,0.08)",
                border: "1px dashed rgba(217,169,75,0.45)",
                color: "rgba(245,239,225,0.7)",
              }}
            >
              <Lock className="size-4" />
              Botão libera em {restante}s
            </div>
          )}

          <p
            className="mt-3 text-center text-[11px]"
            style={{ color: "rgba(245,239,225,0.55)" }}
          >
            Garantia incondicional de 7 dias.
          </p>
        </div>
      </div>
    </div>
  );
}
