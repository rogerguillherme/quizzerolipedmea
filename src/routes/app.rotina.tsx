import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  X,
  Lock,
  Loader2,
  Sparkles,
  ChevronRight,
  Flame,
  Coffee,
  UtensilsCrossed,
  Apple,
  Moon,
  PartyPopper,
} from "lucide-react";

import {
  ROTINA_SEMANAS,
  META_DIAS_SEMANA,
  FRASES_REFORCO,
  getSemana,
  type SemanaRotina,
} from "@/lib/rotina-content";
import {
  getRotina,
  registrarCheckin,
  desfazerCheckin,
  avancarSemana,
} from "@/lib/rotina.functions";
import { track } from "../lib/analytics";
import { trackMeta } from "../lib/meta-track";

export const Route = createFileRoute("/app/rotina")({
  component: RotinaPage,
  head: () => ({
    meta: [
      { title: "Rotina Zero Lipedema | Sua rotina semana a semana" },
      {
        name: "description",
        content:
          "Ajuste uma refeição por semana com a Rotina Zero Lipedema: café da manhã, almoço, lanche e jantar, sem contar caloria.",
      },
      { property: "og:title", content: "Rotina Zero Lipedema" },
      {
        property: "og:description",
        content:
          "Uma refeição nova por semana. Em 4 semanas suas refeições principais estão ajustadas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const GOLD_LIGHT = "#D9A94B";
const CREAM_SOFT = "#FBF6E9";

const CARD_BASE = "rounded-3xl border";
const CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,253,247,0.95)",
  borderColor: "rgba(216,198,160,0.55)",
  boxShadow: "0 14px 30px -22px rgba(22,50,79,0.5)",
};

const ICONES = [Coffee, UtensilsCrossed, Apple, Moon] as const;

function RotinaPage() {
  const fetchRotina = useServerFn(getRotina);
  const doCheckin = useServerFn(registrarCheckin);
  const undoCheckin = useServerFn(desfazerCheckin);
  const doAvancar = useServerFn(avancarSemana);
  const qc = useQueryClient();

  const [semanaAberta, setSemanaAberta] = useState<number | null>(null);
  const [frase, setFrase] = useState<string>(() => FRASES_REFORCO[0]!);

  const { data: estado, isLoading } = useQuery({
    queryKey: ["rotina"],
    queryFn: () => fetchRotina(),
  });

  const setEstado = (novo: unknown) => qc.setQueryData(["rotina"], novo);

  const checkinMut = useMutation({
    mutationFn: () => doCheckin({ data: {} }),
    onSuccess: (novo) => {
      setEstado(novo);
      setFrase(
        FRASES_REFORCO[Math.floor(Math.random() * FRASES_REFORCO.length)]!,
      );
      track("rotina_checkin");
      trackMeta("ViewContent", { content_name: "Rotina check-in" });
    },
  });

  const desfazerMut = useMutation({
    mutationFn: () => undoCheckin(),
    onSuccess: setEstado,
  });

  const avancarMut = useMutation({
    mutationFn: () => doAvancar(),
    onSuccess: (novo) => {
      setEstado(novo);
      track("rotina_avancou_semana");
    },
  });

  const semanaAtual = estado?.semanaAtual ?? 1;
  const semana = useMemo(() => getSemana(semanaAtual), [semanaAtual]);
  const isPremium = estado?.isPremium ?? false;
  const concluida = !!estado?.concluidaEm;

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="size-6 animate-spin" style={{ color: NAVY }} />
      </div>
    );
  }

  if (concluida) {
    return <Celebracao />;
  }

  const dias = estado?.diasNaSemana ?? 0;
  const pct = Math.min(100, Math.round((dias / META_DIAS_SEMANA) * 100));

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-5 pb-10">
      {/* Cabeçalho */}
      <section
        className="relative overflow-hidden rounded-3xl px-5 py-6"
        style={{
          background: `linear-gradient(160deg, ${NAVY} 0%, #0E2439 100%)`,
          color: CREAM_SOFT,
          boxShadow: "0 20px 40px -20px rgba(22,50,79,0.55)",
        }}
      >
        <div
          aria-hidden
          className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }}
        />
        <p
          className="text-[10px] font-bold uppercase"
          style={{ letterSpacing: "0.26em", color: GOLD_LIGHT }}
        >
          Rotina Zero Lipedema
        </p>
        <h1
          className="mt-2 text-2xl leading-tight"
          style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
        >
          Semana {semanaAtual} de 4 · {semana.refeicao}
        </h1>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] opacity-85">
            <span>
              {dias} de {META_DIAS_SEMANA} dias com check-in
            </span>
            {(estado?.sequencia ?? 0) > 1 && (
              <span className="inline-flex items-center gap-1" style={{ color: GOLD_LIGHT }}>
                <Flame className="size-3.5" />
                {estado?.sequencia} dias seguidos
              </span>
            )}
          </div>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(255,253,247,0.16)" }}
            role="progressbar"
            aria-valuenow={dias}
            aria-valuemin={0}
            aria-valuemax={META_DIAS_SEMANA}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
              }}
            />
          </div>
        </div>
      </section>

      {/* Missão da semana */}
      <section className="mt-5">
        <MissaoCard semana={semana} bloqueado={!isPremium} />
      </section>

      {/* Loop diário */}
      {isPremium && (
        <section className="mt-5">
          {estado?.checkinHoje ? (
            <div
              className={`${CARD_BASE} px-5 py-5 text-center`}
              style={{
                ...CARD_STYLE,
                borderColor: "rgba(175,127,53,0.6)",
              }}
            >
              <p
                className="text-[15px] font-semibold"
                style={{ color: NAVY, fontFamily: "'Nunito', sans-serif" }}
              >
                Missão de hoje concluída ✓
              </p>
              {(estado?.sequencia ?? 0) > 0 && (
                <p className="mt-1 text-[13px]" style={{ color: GOLD }}>
                  {estado?.sequencia} {estado?.sequencia === 1 ? "dia" : "dias"} seguidos
                </p>
              )}
              <p className="mt-2 text-[13px] leading-relaxed text-[#5C5749]">{frase}</p>
              <button
                type="button"
                onClick={() => desfazerMut.mutate()}
                disabled={desfazerMut.isPending}
                className="mt-3 text-[12px] underline underline-offset-2 opacity-70"
                style={{ color: NAVY }}
              >
                {desfazerMut.isPending ? "Desfazendo..." : "Desfazer check-in de hoje"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => checkinMut.mutate()}
              disabled={checkinMut.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-[15px] font-bold transition-transform active:scale-[0.98] disabled:opacity-70"
              style={{
                background: `linear-gradient(180deg, #E7BE5C, ${GOLD})`,
                color: NAVY,
                boxShadow: "0 12px 26px -12px rgba(175,127,53,0.8)",
              }}
            >
              {checkinMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Cumpri a missão de hoje
            </button>
          )}

          {checkinMut.isError && (
            <p className="mt-2 text-center text-[12px] text-[#B3261E]">
              Não consegui salvar agora. Tenta de novo em instantes.
            </p>
          )}

          {/* Avançar de semana */}
          {semanaAtual < 4 && (
            <div className="mt-4 text-center">
              {estado?.podeAvancar ? (
                <button
                  type="button"
                  onClick={() => avancarMut.mutate()}
                  disabled={avancarMut.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold"
                  style={{ borderColor: GOLD, color: NAVY, background: "rgba(255,253,247,0.9)" }}
                >
                  Avançar para a Semana {semanaAtual + 1}
                  <ChevronRight className="size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => avancarMut.mutate()}
                  disabled={avancarMut.isPending}
                  className="text-[12px] underline underline-offset-2 opacity-70"
                  style={{ color: NAVY }}
                >
                  Já estou pronta para a próxima
                </button>
              )}
            </div>
          )}

          {semanaAtual === 4 && (estado?.podeAvancar || dias >= 5) && (
            <button
              type="button"
              onClick={() => avancarMut.mutate()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold"
              style={{
                background: `linear-gradient(180deg, #E7BE5C, ${GOLD})`,
                color: NAVY,
              }}
            >
              <PartyPopper className="size-4" />
              Concluir a Rotina
            </button>
          )}
        </section>
      )}

      {!isPremium && (
        <section
          className={`${CARD_BASE} mt-5 px-5 py-5 text-center`}
          style={{ ...CARD_STYLE, borderColor: "rgba(175,127,53,0.6)" }}
        >
          <p className="text-[14px] leading-relaxed" style={{ color: NAVY }}>
            A Rotina completa faz parte do Plano Zero Lipedema. São 4 semanas, uma
            refeição por vez, sem contar caloria.
          </p>
          <Link
            to="/app/derma"
            onClick={() => track("rotina_bloqueada_cta")}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold"
            style={{
              background: `linear-gradient(180deg, #E7BE5C, ${GOLD})`,
              color: NAVY,
            }}
          >
            <Sparkles className="size-4" />
            Conhecer o plano
          </Link>
        </section>
      )}

      {/* Mapa das 4 semanas */}
      <section className="mt-7 space-y-2">
        <p
          className="px-1 text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.22em", color: GOLD }}
        >
          Suas 4 semanas
        </p>
        {ROTINA_SEMANAS.map((s, i) => {
          const Icone = ICONES[i]!;
          const concluidaSemana = s.numero < semanaAtual;
          const atual = s.numero === semanaAtual;
          const futura = s.numero > semanaAtual;
          const aberta = semanaAberta === s.numero;
          return (
            <article
              key={s.numero}
              className="overflow-hidden rounded-2xl border"
              style={{
                background: atual
                  ? "rgba(255,253,247,0.98)"
                  : concluidaSemana
                    ? "rgba(175,127,53,0.10)"
                    : "rgba(22,50,79,0.04)",
                borderColor: atual
                  ? "rgba(175,127,53,0.6)"
                  : "rgba(216,198,160,0.45)",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  futura ? undefined : setSemanaAberta(aberta ? null : s.numero)
                }
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
                aria-expanded={aberta}
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full"
                  style={{
                    background: concluidaSemana
                      ? `linear-gradient(180deg, #E7BE5C, ${GOLD})`
                      : atual
                        ? "rgba(175,127,53,0.18)"
                        : "rgba(22,50,79,0.06)",
                    color: concluidaSemana ? NAVY : atual ? GOLD : "#8A8672",
                  }}
                  aria-hidden
                >
                  {concluidaSemana ? (
                    <Check className="size-4" />
                  ) : futura ? (
                    <Lock className="size-3.5" />
                  ) : (
                    <Icone className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-[14px] font-semibold"
                    style={{ color: futura ? "#8A8672" : NAVY }}
                  >
                    Semana {s.numero} · {s.refeicao}
                  </span>
                  {!futura && (
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-[#5C5749]">
                      {s.objetivo}
                    </span>
                  )}
                </span>
              </button>
              {aberta && !futura && (
                <div className="px-3.5 pb-4">
                  <ListasSemana semana={s} />
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* Materiais de apoio: os 3 guias que acompanham a Rotina. */}
      <section className="mt-7">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.24em]"
          style={{ color: GOLD }}
        >
          Materiais de apoio
        </p>
        <p className="mt-1.5 mb-3 text-[12.5px] leading-relaxed text-[#5C5749]">
          Para consultar sempre que precisar, em qualquer semana.
        </p>
        <GuiasCards />
      </section>
    </div>
  );
}


function MissaoCard({
  semana,
  bloqueado,
}: {
  semana: SemanaRotina;
  bloqueado: boolean;
}) {
  return (
    <article
      className={`${CARD_BASE} relative overflow-hidden px-5 py-5`}
      style={{ ...CARD_STYLE, borderColor: "rgba(175,127,53,0.6)" }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: GOLD }}
      >
        Missão da semana
      </p>
      <h2
        className="mt-1 text-xl leading-snug"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 500,
          color: NAVY,
        }}
      >
        {semana.refeicao}
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#4A4635]">
        {semana.objetivo}
      </p>

      <div className="relative mt-4">
        <div
          className={bloqueado ? "pointer-events-none select-none blur-[6px]" : ""}
          aria-hidden={bloqueado}
        >
          <ListasSemana semana={semana} />
        </div>

        {bloqueado && (
          <div className="absolute inset-0 grid place-items-center px-4 text-center">
            <div>
              <Lock className="mx-auto size-5" style={{ color: GOLD }} />
              <p className="mt-2 text-[13px] font-semibold" style={{ color: NAVY }}>
                Conteúdo do Plano Zero Lipedema
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function ListasSemana({ semana }: { semana: SemanaRotina }) {
  return (
    <div className="space-y-4">
      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: "#2E7D5B" }}
        >
          O que entra
        </p>
        <ul className="mt-2 space-y-1.5">
          {semana.entra.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[13px] text-[#3E4F65]">
              <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: "#2E7D5B" }} />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: "#9A8C74" }}
        >
          O que sai
        </p>
        <ul className="mt-2 space-y-1.5">
          {semana.sai.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[13px] text-[#6B6555]">
              <X className="mt-0.5 size-3.5 shrink-0 opacity-60" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background: "rgba(175,127,53,0.10)",
          border: "1px solid rgba(175,127,53,0.35)",
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: GOLD }}
        >
          Regra de ouro
        </p>
        <p className="mt-1 text-[13px] leading-relaxed" style={{ color: NAVY }}>
          {semana.regra}
        </p>
        <p className="mt-1 text-[12px] text-[#5C5749]">
          Sem contar caloria, sem limitar quantidade.
        </p>
      </div>
    </div>
  );
}

function Celebracao() {
  return (
    <div className="mx-auto w-full max-w-md px-5 pt-8 pb-10">
      <section
        className="relative overflow-hidden rounded-3xl px-5 py-8 text-center"
        style={{
          background: `linear-gradient(160deg, ${NAVY} 0%, #0E2439 100%)`,
          color: CREAM_SOFT,
          boxShadow: "0 20px 40px -20px rgba(22,50,79,0.55)",
        }}
      >
        <PartyPopper className="mx-auto size-8" style={{ color: GOLD_LIGHT }} />
        <h1
          className="mt-3 text-2xl leading-tight"
          style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
        >
          Suas 4 refeições principais estão ajustadas
        </h1>
        <p className="mt-3 text-sm opacity-85">
          Você passou pelo café da manhã, almoço, lanche e jantar sem contar caloria e
          sem passar fome. Esse é o alicerce da rotina.
        </p>
      </section>

      <section
        className={`${CARD_BASE} mt-5 px-5 py-5`}
        style={{ ...CARD_STYLE, borderColor: "rgba(175,127,53,0.6)" }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: GOLD }}
        >
          O próximo passo
        </p>
        <h2
          className="mt-1 text-lg"
          style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: NAVY }}
        >
          Mês 2: fase de ajuste
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#4A4635]">
          Agora a gente afina o que já está de pé, olhando o seu corpo e a sua resposta.
          No Acompanhamento Zero Lipedema você tem anamnese completa, leitura dos seus
          exames e ajuste individual comigo.
        </p>
        <Link
          to="/app/derma"
          onClick={() => track("rotina_concluida_upsell")}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold"
          style={{
            background: `linear-gradient(180deg, #E7BE5C, ${GOLD})`,
            color: NAVY,
          }}
        >
          <Sparkles className="size-4" />
          Conhecer o Acompanhamento
          <ChevronRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}
