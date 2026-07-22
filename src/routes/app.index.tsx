import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Clock, Stethoscope, Activity, Target, HeartPulse } from "lucide-react";
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

const LABELS_Q: Record<string, { icon: React.ReactNode; label: string }> = {
  tempo: { icon: <Clock className="size-3.5" />, label: "Tempo com sintomas" },
  diagnostico: { icon: <Stethoscope className="size-3.5" />, label: "Diagnóstico" },
  sintomaMaior: { icon: <HeartPulse className="size-3.5" />, label: "Sintoma principal" },
  pesoPernas: { icon: <Activity className="size-3.5" />, label: "Peso × pernas" },
  dietaExercicio: { icon: <Activity className="size-3.5" />, label: "Dieta & exercício" },
  atividade: { icon: <Activity className="size-3.5" />, label: "Nível de atividade" },
  exames: { icon: <Stethoscope className="size-3.5" />, label: "Exames recentes" },
  objetivo: { icon: <Target className="size-3.5" />, label: "Objetivo agora" },
};

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
  const respostas = ((profile as any)?.respostas as Record<string, string> | null) ?? {};
  const estagio = diagnostico?.estagio ?? "Indeterminado";
  const prioridades = diagnostico?.prioridades?.slice(0, 3) ?? [];
  const abertura = diagnostico?.aberturaValidadora ?? "";
  const descricao = diagnostico?.descricaoEstagio ?? "";

  const respostasOrdenadas = Object.entries(LABELS_Q)
    .map(([k, meta]) => ({ k, meta, valor: respostas[k] }))
    .filter((r) => r.valor);

  return (
    <div className="px-5 pt-6">
      {error && (
        <p className="mb-4 text-center text-[13px]" style={{ color: "#5B5D52" }}>
          Não consegui carregar seu perfil por completo — abaixo está sua avaliação essencial.
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
          <em className="italic" style={{ color: "#D9A94B" }}>{nome}</em>, este é o seu mapa.
        </h1>
        <p
          className="mt-3 max-w-[36ch] text-[14.5px]"
          style={{ color: "rgba(245,239,225,0.85)", lineHeight: 1.55 }}
        >
          Sua leitura foi feita a partir das suas próprias respostas. É um retrato do seu caso hoje.
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

      {/* Avaliação do caso */}
      <section className="mt-8">
        <Eyebrow>Sua avaliação</Eyebrow>
        <div
          className="mt-3 rounded-2xl p-5"
          style={{
            background: "rgba(255,253,247,0.9)",
            border: "1px solid rgba(216,198,160,0.55)",
            boxShadow: "0 10px 24px -18px rgba(22,50,79,0.35)",
          }}
        >
          {abertura && (
            <p
              className="text-[14.5px]"
              style={{
                color: "#16324F",
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              “{abertura}”
            </p>
          )}
          {descricao && (
            <p
              className="mt-3 text-[13.5px]"
              style={{ color: "#5B5D52", lineHeight: 1.55 }}
            >
              {descricao}
            </p>
          )}

          {respostasOrdenadas.length > 0 && (
            <div className="mt-4 space-y-2">
              {respostasOrdenadas.map(({ k, meta, valor }) => (
                <div
                  key={k}
                  className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                  style={{
                    background: "rgba(22,50,79,0.04)",
                    border: "1px solid rgba(216,198,160,0.35)",
                  }}
                >
                  <span
                    className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full"
                    style={{
                      background: "rgba(175,127,53,0.12)",
                      color: "#AF7F35",
                    }}
                  >
                    {meta.icon}
                  </span>
                  <div className="flex-1">
                    <p
                      className="text-[10.5px] font-semibold uppercase"
                      style={{ letterSpacing: "0.16em", color: "#AF7F35" }}
                    >
                      {meta.label}
                    </p>
                    <p className="text-[13px]" style={{ color: "#16324F", lineHeight: 1.4 }}>
                      {valor}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
