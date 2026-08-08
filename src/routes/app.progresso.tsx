import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  ArrowRight,
  ChevronDown,
  Clock,
  Flame,
  HeartPulse,
  Loader2,
  Moon,
  Stethoscope,
  Target,
  Utensils,
  X,
} from "lucide-react";
import { getRotina } from "@/lib/rotina.functions";
import { getSemana } from "@/lib/rotina-content";
import { getMyProfile } from "@/lib/mapa-access.functions";
import { getMealTestStatus } from "@/lib/meal-test.functions";
import { listarRefeicoesRemotas, loadLocalMeals, type MealEntry } from "@/lib/refeicoes";
import type { Diagnostico } from "@/lib/mapa.functions";
import { isoLocal } from "@/lib/data-local";

export const Route = createFileRoute("/app/progresso")({
  component: Progresso,
  head: () => ({
    meta: [
      { title: "Progresso · Zero Lipedema" },
      {
        name: "description",
        content: "Sua sequência de check-ins, semanas da Rotina, refeições registradas e o histórico do seu Mapa do Lipedema.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

import { NAVY, GOLD, GOLD_LIGHT as GOLD_SOFT, GOLD_LABEL, INK_SOFT } from "@/lib/tokens";

const CARD = {
  background: "rgba(255,253,247,0.9)",
  border: "1px solid rgba(216,198,160,0.55)",
  boxShadow: "0 10px 24px -20px rgba(22,50,79,0.3)",
};

/** Rótulos das 12 perguntas do Mapa do Lipedema. */
const LABELS_Q: Record<string, { icon: React.ReactNode; label: string }> = {
  tempo: { icon: <Clock className="size-3.5" />, label: "Tempo com sintomas" },
  diagnostico: { icon: <Stethoscope className="size-3.5" />, label: "Diagnóstico" },
  sintomaMaior: { icon: <HeartPulse className="size-3.5" />, label: "Sintoma principal" },
  dorNivel: { icon: <Flame className="size-3.5" />, label: "Nível de dor" },
  pesoPernas: { icon: <Activity className="size-3.5" />, label: "Peso nas pernas" },
  dietaExercicio: { icon: <Activity className="size-3.5" />, label: "Dieta & exercício" },
  atividade: { icon: <Activity className="size-3.5" />, label: "Nível de atividade" },
  sono: { icon: <Moon className="size-3.5" />, label: "Qualidade do sono" },
  intestino: { icon: <Activity className="size-3.5" />, label: "Funcionamento do intestino" },
  sinaisNutricionais: { icon: <Utensils className="size-3.5" />, label: "Sinais nutricionais" },
  exames: { icon: <Stethoscope className="size-3.5" />, label: "Exames recentes" },
  objetivo: { icon: <Target className="size-3.5" />, label: "Objetivo agora" },
};



function Progresso() {
  const fetchRotina = useServerFn(getRotina);
  const fetchProfile = useServerFn(getMyProfile);
  const fetchStatus = useServerFn(getMealTestStatus);

  const { data: rotina, isLoading } = useQuery({ queryKey: ["rotina"], queryFn: () => fetchRotina() });
  const { data: profile } = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });
  const { data: status } = useQuery({ queryKey: ["meal-test-status"], queryFn: () => fetchStatus() });

  const pago = Boolean(status?.pago);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [aberta, setAberta] = useState<MealEntry | null>(null);
  const [mapaAberto, setMapaAberto] = useState(false);

  useEffect(() => {
    let vivo = true;
    if (status === undefined) return;
    if (pago) {
      void listarRefeicoesRemotas(60).then((m) => {
        if (vivo) setMeals(m);
      });
    } else {
      setMeals(loadLocalMeals());
    }
    return () => {
      vivo = false;
    };
  }, [status, pago]);

  if (isLoading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Loader2 className="size-6 animate-spin" style={{ color: NAVY }} />
      </div>
    );
  }

  const datas = new Set<string>(rotina?.todasDatas ?? []);
  const sequencia = rotina?.sequencia ?? 0;
  const recorde = rotina?.recorde ?? 0;
  const totalCheckins = rotina?.totalCheckins ?? datas.size;

  const semanasConcluidas = new Set<number>(rotina?.semanasConcluidas ?? []);
  const semanaAtual = rotina?.semanaAtual ?? 1;

  // Últimas 4 semanas (28 dias), a mais antiga primeiro.
  const hoje = new Date();
  const dias: { iso: string; feito: boolean }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(hoje.getTime() - i * 86_400_000);
    const iso = isoLocal(d);
    dias.push({ iso, feito: datas.has(iso) });
  }

  const diagnostico = ((profile as { diagnostico?: Diagnostico | null } | undefined)?.diagnostico) ?? null;
  const respostas = ((profile as { respostas?: Record<string, string> } | undefined)?.respostas) ?? {};
  const respostasOrdenadas = Object.entries(LABELS_Q)
    .map(([k, meta]) => ({ k, meta, valor: respostas[k] }))
    .filter((r) => r.valor);
  const prioridades = diagnostico?.prioridades?.slice(0, 3) ?? [];

  return (
    <div className="px-5 pt-6 pb-8">
      <p className="text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.24em", color: GOLD_LABEL }}>
        Seu histórico
      </p>
      <h1
        className="mt-1.5"
        style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: "1.6rem", color: NAVY }}
      >
        Progresso
      </h1>

      {/* Sequência */}
      <section
        className="mt-5 grid grid-cols-2 gap-3 rounded-[24px] px-5 py-5"
        style={{
          background: "linear-gradient(160deg, #2C5578 0%, #16324F 55%, #0D2138 100%)",
          boxShadow: "0 24px 40px -28px rgba(22,50,79,0.55)",
          color: "#F5EFE1",
        }}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.22em", color: GOLD_SOFT }}>
            Sequência
          </p>
          {sequencia > 0 ? (
            <>
              <p className="mt-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", lineHeight: 1 }}>
                {sequencia}
              </p>
              <p className="mt-1 text-[12.5px]" style={{ color: "rgba(245,239,225,0.7)" }}>
                {sequencia === 1 ? "dia seguido" : "dias seguidos"}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[14px]" style={{ color: "rgba(245,239,225,0.9)", lineHeight: 1.4 }}>
              Vamos começar hoje
            </p>
          )}
          <p className="mt-2 text-[12.5px]" style={{ color: GOLD_SOFT }}>
            {totalCheckins} {totalCheckins === 1 ? "dia" : "dias"} no seu histórico
          </p>
        </div>

        <div style={{ borderLeft: "1px solid rgba(245,239,225,0.16)", paddingLeft: "1rem" }}>
          <p className="text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.22em", color: GOLD_SOFT }}>
            Recorde
          </p>
          <p className="mt-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", lineHeight: 1 }}>
            {recorde}
          </p>
          <p className="mt-1 text-[12.5px]" style={{ color: "rgba(245,239,225,0.7)" }}>
            {recorde === 1 ? "dia seguido" : "dias seguidos"}
          </p>
        </div>
      </section>

      {/* Calendário */}
      <section className="mt-6 rounded-[24px] p-5" style={CARD}>
        <p className="text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.24em", color: GOLD_LABEL }}>
          Últimas 4 semanas
        </p>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {dias.map((d) => (
            <span
              key={d.iso}
              title={d.iso}
              className="aspect-square rounded-[6px]"
              style={{
                background: d.feito ? "linear-gradient(180deg, #D9A94B, #AF7F35)" : "rgba(22,50,79,0.07)",
                border: d.feito ? "none" : "1px solid rgba(216,198,160,0.4)",
              }}
            />
          ))}
        </div>
        <p className="mt-3 text-[12.5px]" style={{ color: INK_SOFT }}>
          {datas.size === 0
            ? "Seus check-ins aparecem aqui."
            : `${datas.size} ${datas.size === 1 ? "dia registrado" : "dias registrados"} no total.`}
        </p>
      </section>

      {/* Semanas da Rotina */}
      <section className="mt-6">
        <p className="text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.24em", color: GOLD_LABEL }}>
          Semanas da Rotina
        </p>
        <div className="mt-3 space-y-2">
          {[1, 2, 3, 4].map((n) => {
            const s = getSemana(n);
            const concluida = semanasConcluidas.has(n);
            const atual = n === semanaAtual && !concluida;
            return (
              <div key={n} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={CARD}>
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold"
                  style={
                    concluida
                      ? { background: "linear-gradient(180deg, #D9A94B, #AF7F35)", color: NAVY }
                      : { background: "rgba(22,50,79,0.06)", color: INK_SOFT, border: "1px solid rgba(216,198,160,0.5)" }
                  }
                >
                  {n}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold" style={{ color: NAVY }}>
                    {s.refeicao}
                  </p>
                  <p className="text-[12.5px]" style={{ color: INK_SOFT }}>
                    {concluida ? "Concluída" : atual ? "Em andamento" : "A seguir"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Refeições registradas */}
      <section className="mt-6">
        <p className="text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.24em", color: GOLD_LABEL }}>
          Refeições registradas
        </p>
        {meals.length === 0 ? (
          <p className="mt-2.5 text-[12.5px]" style={{ color: INK_SOFT }}>
            Você ainda não registrou refeições. Comece pela próxima.{" "}
            <Link to="/app/registrar" style={{ color: NAVY, fontWeight: 600 }}>
              Registrar agora →
            </Link>
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {meals.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setAberta(m)}
                className="aspect-square overflow-hidden rounded-xl"
                style={{ border: "1px solid rgba(216,198,160,0.55)", background: "rgba(22,50,79,0.05)" }}
              >
                {m.preview ? (
                  <img src={m.preview} alt="Refeição registrada" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center">
                    <Utensils className="size-4" style={{ color: GOLD }} />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Mapa do Lipedema (acordeão) */}
      <section className="mt-6 overflow-hidden rounded-[24px]" style={CARD}>
        <button
          type="button"
          onClick={() => setMapaAberto((v) => !v)}
          className="flex w-full items-center gap-3 px-5 py-4 text-left"
          aria-expanded={mapaAberto}
        >
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.24em", color: GOLD_LABEL }}>
              Histórico
            </p>
            <p className="mt-0.5 text-[14px] font-semibold" style={{ color: NAVY }}>
              Seu Mapa do Lipedema
            </p>
          </div>
          <ChevronDown
            className="size-4 shrink-0 transition-transform"
            style={{ color: NAVY, transform: mapaAberto ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>

        {mapaAberto && (
          <div className="px-5 pb-5">
            <p className="text-[12px]" style={{ color: INK_SOFT }}>
              Estágio percebido:{" "}
              <strong style={{ color: NAVY }}>{diagnostico?.estagio ?? "Indeterminado"}</strong>
            </p>
            {diagnostico?.descricaoEstagio && (
              <p className="mt-2 text-[12.5px]" style={{ color: "#2F3128", lineHeight: 1.55 }}>
                {diagnostico.descricaoEstagio}
              </p>
            )}

            {respostasOrdenadas.length > 0 && (
              <div className="mt-4 space-y-2">
                {respostasOrdenadas.map(({ k, meta, valor }) => (
                  <div
                    key={k}
                    className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                    style={{ background: "rgba(22,50,79,0.04)", border: "1px solid rgba(216,198,160,0.35)" }}
                  >
                    <span
                      className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full"
                      style={{ background: "rgba(175,127,53,0.12)", color: GOLD }}
                    >
                      {meta.icon}
                    </span>
                    <div className="flex-1">
                      <p
                        className="text-[10.5px] font-semibold uppercase"
                        style={{ letterSpacing: "0.16em", color: GOLD_LABEL }}
                      >
                        {meta.label}
                      </p>
                      <p className="text-[13px]" style={{ color: NAVY, lineHeight: 1.4 }}>
                        {valor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {prioridades.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.24em", color: GOLD_LABEL }}>
                  Suas 3 prioridades
                </p>
                <ul className="mt-2 space-y-1.5">
                  {prioridades.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px]" style={{ color: "#2F3128", lineHeight: 1.5 }}>
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: GOLD_SOFT }} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Próximo passo — só para quem já comprou */}
      {pago && (
        <section
          className="mt-6 overflow-hidden rounded-[24px] px-5 py-6"
          style={{
            background: "linear-gradient(160deg, #2C5578 0%, #16324F 55%, #0D2138 100%)",
            boxShadow: "0 24px 40px -28px rgba(22,50,79,0.55)",
            color: "#F5EFE1",
          }}
        >
          <p className="text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.24em", color: GOLD_SOFT }}>
            Próximo passo
          </p>
          <h2
            className="mt-2 text-[1.35rem]"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, lineHeight: 1.2 }}
          >
            Acompanhamento <em className="italic" style={{ color: GOLD_SOFT }}>Zero Lipedema</em>
          </h2>
          <p className="mt-3 text-[13px]" style={{ color: "rgba(245,239,225,0.85)", lineHeight: 1.6 }}>
            Três meses comigo de perto: plano alimentar personalizado para o seu caso, leitura dos seus exames e suporte direto no WhatsApp.
          </p>
          <p className="mt-3 text-[13px] font-semibold" style={{ color: GOLD_SOFT }}>
            R$297 · 3 meses
          </p>
          <Link
            to="/upsell"
            className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold"
            style={{ background: GOLD_SOFT, color: NAVY }}
          >
            Quero o acompanhamento <ArrowRight className="size-4" />
          </Link>
        </section>
      )}

      {/* Detalhe da refeição */}
      {aberta && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: "rgba(13,33,56,0.55)" }}
          onClick={() => setAberta(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-[24px]"
            style={{ background: "#FBF6E9", maxHeight: "82vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Feedback da refeição"
          >
            {aberta.preview && (
              <img src={aberta.preview} alt="Refeição" className="w-full object-cover" style={{ maxHeight: 240 }} />
            )}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.2em", color: GOLD_LABEL }}>
                  {new Date(aberta.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <button type="button" onClick={() => setAberta(null)} aria-label="Fechar">
                  <X className="size-4" style={{ color: NAVY }} />
                </button>
              </div>
              <p className="mt-2 text-[14px]" style={{ color: NAVY, lineHeight: 1.5 }}>
                {aberta.feedback.sugestao}
              </p>
              {aberta.feedback.pontos.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {aberta.feedback.pontos.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px]" style={{ color: "#2F3128", lineHeight: 1.45 }}>
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: GOLD_SOFT }} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 grid grid-cols-5 gap-1">
                {[
                  { l: "kcal", v: aberta.macros.kcal },
                  { l: "prot", v: `${aberta.macros.proteina}g` },
                  { l: "carb", v: `${aberta.macros.carbo}g` },
                  { l: "gord", v: `${aberta.macros.gordura}g` },
                  { l: "fibra", v: `${aberta.macros.fibra}g` },
                ].map((x) => (
                  <div
                    key={x.l}
                    className="min-w-0 rounded-lg px-1 py-1.5 text-center"
                    style={{ background: "rgba(22,50,79,0.05)", border: "1px solid rgba(216,198,160,0.45)" }}
                  >
                    <p className="text-[8.5px] font-semibold uppercase" style={{ letterSpacing: "0.1em", color: INK_SOFT }}>
                      {x.l}
                    </p>
                    <p className="truncate text-[12.5px] font-semibold" style={{ color: NAVY }}>
                      {x.v}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
