import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Utensils,
  Droplets,
  Footprints,
  HeartHandshake,
  Loader2,
  ArrowRight,
  MessageCircle,
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

const HERO_GRADIENTS: Record<string, string> = {
  Inicial: "linear-gradient(135deg, #7BC5F5 0%, #4A90E2 50%, #6B8FE8 100%)",
  Intermediário: "linear-gradient(135deg, #F5B87B 0%, #E28A4A 50%, #E86B8F 100%)",
  Avançado: "linear-gradient(135deg, #B87BF5 0%, #8A4AE2 50%, #6B4AE8 100%)",
  Indeterminado: "linear-gradient(135deg, #7BC5F5 0%, #4A90E2 50%, #6B8FE8 100%)",
};

function GuiaMapa() {
  const fetchProfile = useServerFn(getMyProfile);
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-md px-5 pt-10 text-center">
        <p className="text-muted-foreground">
          Não consegui carregar seu perfil. Tente sair e entrar novamente.
        </p>
      </div>
    );
  }

  const nome = String(profile.nome ?? "").split(" ")[0] || "linda";
  const diagnostico = (profile.diagnostico as Diagnostico | null) ?? null;
  const estagio = diagnostico?.estagio ?? "Indeterminado";
  const gradient = HERO_GRADIENTS[estagio] ?? HERO_GRADIENTS.Indeterminado;
  const prioridades = diagnostico?.prioridades?.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen pb-32" style={{ background: "#F6F9FF" }}>
      {/* Hero personalizado */}
      <section
        className="relative overflow-hidden px-6 pb-10 pt-12 text-white"
        style={{ background: gradient }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 size-64 rounded-full bg-white/10 blur-3xl" />

        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] opacity-90">
          Mapa do Lipedema
        </p>
        <h1
          className="mt-3 text-[2rem] leading-tight tracking-tight"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
        >
          Bem-vinda, <em className="italic opacity-95">{nome}</em>.
        </h1>
        <p className="mt-3 max-w-xs text-[15px] leading-relaxed opacity-90">
          Este é seu guia personalizado com as escolhas certas pra você agora.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur">
          <Sparkles className="size-4" />
          <span className="text-[13px] font-semibold">
            Estágio percebido: {estagio}
          </span>
        </div>
      </section>

      {/* Prioridades personalizadas */}
      {prioridades.length > 0 && (
        <section className="mx-auto max-w-md px-5 pt-8">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] uppercase tracking-[0.28em]"
              style={{ color: "#AF7F35" }}
            >
              Suas 3 prioridades da semana
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {prioridades.map((p, i) => (
              <div
                key={i}
                className="rounded-2xl border border-sapphire-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="grid size-9 shrink-0 place-items-center rounded-full text-white"
                    style={{
                      background: [
                        "linear-gradient(135deg, #4A90E2, #6B8FE8)",
                        "linear-gradient(135deg, #E28A4A, #E86B8F)",
                        "linear-gradient(135deg, #8A4AE2, #6B4AE8)",
                      ][i],
                      fontFamily: "'Fraunces', serif",
                      fontStyle: "italic",
                    }}
                  >
                    {i + 1}
                  </div>
                  <p className="pt-1 text-[15px] leading-relaxed text-foreground">
                    {p}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Guias rápidos */}
      <section className="mx-auto max-w-md px-5 pt-10">
        <span
          className="text-[10px] uppercase tracking-[0.28em]"
          style={{ color: "#AF7F35" }}
        >
          Guias rápidos
        </span>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <GuideCard
            icon={<Utensils className="size-5" />}
            gradient="linear-gradient(135deg, #FFB84D, #FF7A59)"
            title="Como montar o prato"
            desc="Modelo anti-inflamatório em 3 passos"
          />
          <GuideCard
            icon={<Droplets className="size-5" />}
            gradient="linear-gradient(135deg, #4FC3F7, #4A90E2)"
            title="Hidratação & drenagem"
            desc="Rotina de água e chás pra reduzir inchaço"
          />
          <GuideCard
            icon={<Footprints className="size-5" />}
            gradient="linear-gradient(135deg, #81C784, #4CAF50)"
            title="Movimento diário"
            desc="20 minutos que cabem no seu dia"
          />
          <GuideCard
            icon={<HeartHandshake className="size-5" />}
            gradient="linear-gradient(135deg, #BA68C8, #7E57C2)"
            title="Cuidados com a pele"
            desc="Rotina simples pra sensibilidade"
          />
        </div>
      </section>

      {/* CTA protocolo 7 dias */}
      <section className="mx-auto max-w-md px-5 pt-10">
        <Link
          to="/app/missoes"
          className="block overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-sapphire-200/50"
          style={{
            background:
              "linear-gradient(135deg, #16324F 0%, #2C5578 60%, #AF7F35 130%)",
          }}
        >
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] opacity-80">
            <Sparkles className="size-3.5" /> Próximo passo
          </div>
          <h3
            className="mt-3 text-[1.4rem] leading-tight"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Iniciar Protocolo de 7 dias
          </h3>
          <p className="mt-2 text-[13.5px] leading-relaxed opacity-90">
            Uma missão suave por dia, guiada pela Gabriela. Ao final você
            recebe um relatório com o que mudou.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[13px] font-semibold backdrop-blur">
            Começar agora <ArrowRight className="size-4" />
          </div>
        </Link>
      </section>

      {/* Atalho WhatsApp */}
      <section className="mx-auto max-w-md px-5 pt-6">
        <Link
          to="/app/whatsapp"
          className="flex items-center gap-3 rounded-2xl border border-sapphire-100 bg-white p-4"
        >
          <div className="grid size-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
            <MessageCircle className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary">
              Falar com a Gabriela
            </p>
            <p className="text-xs text-muted-foreground">
              Tire dúvidas do dia direto pelo WhatsApp
            </p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </section>
    </div>
  );
}

function GuideCard({
  icon,
  gradient,
  title,
  desc,
}: {
  icon: React.ReactNode;
  gradient: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-sapphire-100 bg-white p-4 shadow-sm">
      <div
        className="grid size-10 place-items-center rounded-xl text-white"
        style={{ background: gradient }}
      >
        {icon}
      </div>
      <p className="mt-3 text-[14px] font-bold text-primary">{title}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
        {desc}
      </p>
    </div>
  );
}
