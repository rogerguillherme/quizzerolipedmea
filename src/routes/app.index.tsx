import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Camera, Check, Loader2, Lock } from "lucide-react";
import { getRotina, registrarCheckin } from "@/lib/rotina.functions";
import { FRASES_REFORCO, META_DIAS_SEMANA, getSemana } from "@/lib/rotina-content";
import { getDicaDoDia } from "@/lib/dicas";
import { getMyProfile } from "@/lib/mapa-access.functions";
import { getMealTestStatus } from "@/lib/meal-test.functions";
import { contarHoje, listarRefeicoesRemotas, loadLocalMeals } from "@/lib/refeicoes";

export const Route = createFileRoute("/app/")({
  component: Hoje,
  head: () => ({
    meta: [
      { title: "Hoje · Zero Lipedema" },
      {
        name: "description",
        content: "Sua ação de hoje na Rotina Zero Lipedema: check-in do dia, registro de refeição e dica prática.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const GOLD_SOFT = "#D9A94B";

const CARD = {
  background: "rgba(255,253,247,0.9)",
  border: "1px solid rgba(216,198,160,0.55)",
  boxShadow: "0 10px 24px -20px rgba(22,50,79,0.3)",
};

function saudacao(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/** YYYY-MM-DD local, mesma base usada pela Rotina. */
function hojeISOLocal(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function Hoje() {
  const qc = useQueryClient();
  const fetchRotina = useServerFn(getRotina);
  const fetchProfile = useServerFn(getMyProfile);
  const fetchStatus = useServerFn(getMealTestStatus);
  const checkin = useServerFn(registrarCheckin);

  const { data: rotina, isLoading } = useQuery({
    queryKey: ["rotina"],
    queryFn: () => fetchRotina(),
  });
  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });
  const { data: status } = useQuery({
    queryKey: ["meal-test-status"],
    queryFn: () => fetchStatus(),
  });

  const pago = Boolean(status?.pago);
  const [refeicoesHoje, setRefeicoesHoje] = useState(0);

  useEffect(() => {
    let vivo = true;
    if (status === undefined) return;
    if (pago) {
      void listarRefeicoesRemotas(60).then((m) => {
        if (vivo) setRefeicoesHoje(contarHoje(m));
      });
    } else {
      setRefeicoesHoje(contarHoje(loadLocalMeals()));
    }
    return () => {
      vivo = false;
    };
  }, [status, pago]);

  const mut = useMutation({
    mutationFn: () => checkin({ data: {} }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rotina"] });
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Loader2 className="size-6 animate-spin" style={{ color: NAVY }} />
      </div>
    );
  }

  const agora = new Date();
  const hojeISO = hojeISOLocal();
  const nome = String((profile as { nome?: string } | undefined)?.nome ?? "").split(" ")[0] || "linda";
  const isPremium = Boolean(rotina?.isPremium);
  const semanaNum = rotina?.semanaAtual ?? 1;
  const semana = getSemana(isPremium ? semanaNum : 1);
  const diasNaSemana = rotina?.diasNaSemana ?? 0;
  const checkinFeito = Boolean(rotina?.checkinHoje);
  const sequencia = rotina?.sequencia ?? 0;
  const dica = getDicaDoDia(hojeISO);

  // Frase determinística pelo dia, para não trocar a cada render.
  const frase =
    FRASES_REFORCO[
      Number(hojeISO.replaceAll("-", "")) % FRASES_REFORCO.length
    ] ?? FRASES_REFORCO[0]!;

  const dataExtenso = agora.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="px-5 pt-6 pb-8">
      {/* 1. Saudação */}
      <header>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            fontSize: "1.6rem",
            lineHeight: 1.15,
            color: NAVY,
          }}
        >
          {saudacao(agora)},{" "}
          <em className="italic" style={{ color: GOLD }}>
            {nome}
          </em>
        </h1>
        <p className="mt-1 text-[12px] capitalize" style={{ color: "#5C5749" }}>
          {dataExtenso}
        </p>
      </header>

      {/* 2. Missão de hoje */}
      <section
        className="relative mt-5 overflow-hidden rounded-[24px] px-5 py-6"
        style={{
          background: "linear-gradient(160deg, #2C5578 0%, #16324F 55%, #0D2138 100%)",
          boxShadow: "0 24px 40px -28px rgba(22,50,79,0.55)",
          color: "#F5EFE1",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(217,169,75,0.32), transparent 70%)" }}
        />
        <p className="text-[10px] font-semibold uppercase" style={{ letterSpacing: "0.24em", color: GOLD_SOFT }}>
          {isPremium
            ? `Semana ${semanaNum} de 4 · ${semana.refeicao}`
            : `Semana 1 · ${semana.refeicao}`}
        </p>

        <h2
          className="mt-2.5 text-[1.15rem]"
          style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, lineHeight: 1.3 }}
        >
          {semana.objetivo}
        </h2>

        {isPremium ? (
          checkinFeito ? (
            <div className="mt-5">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
                style={{ background: "rgba(217,169,75,0.18)", border: "1px solid rgba(217,169,75,0.45)", color: GOLD_SOFT }}
              >
                <Check className="size-3.5" /> Missão de hoje cumprida
              </div>
              <p className="mt-3 text-[13px]" style={{ color: "rgba(245,239,225,0.86)", lineHeight: 1.55 }}>
                {frase}
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: "rgba(245,239,225,0.65)" }}>
                {sequencia === 1 ? "1 dia seguido" : `${sequencia} dias seguidos`}
              </p>
            </div>
          ) : (
            <button
              type="button"
              disabled={mut.isPending}
              onClick={() => mut.mutate()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-[13.5px] font-semibold uppercase transition-opacity disabled:opacity-60"
              style={{
                background: "linear-gradient(180deg, #D9A94B, #AF7F35)",
                color: NAVY,
                letterSpacing: "0.14em",
                boxShadow: "0 12px 24px -14px rgba(175,127,53,0.65)",
              }}
            >
              {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Cumpri a missão de hoje
            </button>
          )
        ) : (
          <>
            <div className="relative mt-4">
              <div className="select-none" style={{ filter: "blur(4px)", opacity: 0.75 }} aria-hidden>
                <p className="text-[13px]" style={{ lineHeight: 1.6 }}>
                  {semana.entra.slice(0, 3).join(" · ")}
                </p>
                <p className="mt-1.5 text-[13px]" style={{ lineHeight: 1.6 }}>
                  {semana.sai.slice(0, 3).join(" · ")}
                </p>
              </div>
              <span
                className="absolute right-0 top-0 grid size-8 place-items-center rounded-full"
                style={{ background: "rgba(245,239,225,0.14)", color: GOLD_SOFT }}
              >
                <Lock className="size-3.5" />
              </span>
            </div>
            <Link
              to="/app/derma"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-[13.5px] font-semibold uppercase"
              style={{
                background: "linear-gradient(180deg, #D9A94B, #AF7F35)",
                color: NAVY,
                letterSpacing: "0.14em",
                boxShadow: "0 12px 24px -14px rgba(175,127,53,0.65)",
              }}
            >
              Liberar a Rotina
            </Link>
          </>
        )}

        {mut.isError && (
          <p className="mt-3 text-[12px]" style={{ color: "#F3C6C6" }}>
            Não consegui registrar agora. Tenta de novo em instantes?
          </p>
        )}

        {isPremium && (
          <Link
            to="/app/rotina"
            className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
            style={{ color: GOLD_SOFT }}
          >
            ver a missão completa <ArrowRight className="size-3.5" />
          </Link>
        )}
      </section>

      {/* 3. Registrar refeição */}
      <section className="mt-4">
        <Link
          to="/app/registrar"
          search={{ camera: true }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-[13px] font-semibold uppercase"
          style={{
            background: "rgba(255,253,247,0.95)",
            border: "1px solid rgba(216,198,160,0.7)",
            color: NAVY,
            letterSpacing: "0.14em",
            boxShadow: "0 10px 24px -20px rgba(22,50,79,0.35)",
          }}
        >
          <Camera className="size-4" style={{ color: GOLD }} /> Registrar refeição
        </Link>
        <p className="mt-2 text-center text-[11.5px]" style={{ color: "#5C5749" }}>
          {refeicoesHoje === 0
            ? "Nenhuma refeição registrada hoje."
            : refeicoesHoje === 1
            ? "1 refeição registrada hoje."
            : `${refeicoesHoje} refeições registradas hoje.`}
        </p>
      </section>

      {/* 4. Progresso da semana */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase" style={{ letterSpacing: "0.24em", color: GOLD }}>
            Progresso da semana
          </p>
          <p className="text-[11.5px] font-semibold" style={{ color: NAVY }}>
            {Math.min(diasNaSemana, META_DIAS_SEMANA)} de {META_DIAS_SEMANA} dias
          </p>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          {Array.from({ length: META_DIAS_SEMANA }, (_, i) => {
            const feito = i < diasNaSemana;
            return (
              <span
                key={i}
                className="h-2 flex-1 rounded-full"
                style={{
                  background: feito ? "linear-gradient(90deg, #D9A94B, #AF7F35)" : "rgba(22,50,79,0.1)",
                }}
              />
            );
          })}
        </div>
      </section>

      {/* 5. Dica do dia */}
      <section className="mt-6 rounded-[24px] p-5" style={CARD}>
        <p className="text-[10px] font-semibold uppercase" style={{ letterSpacing: "0.24em", color: GOLD }}>
          Dica do dia
        </p>
        <p
          className="mt-2 text-[15px]"
          style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: NAVY }}
        >
          {dica.titulo}
        </p>
        <p className="mt-1.5 text-[12.5px]" style={{ color: "#2F3128", lineHeight: 1.55 }}>
          {dica.detalhe.slice(0, 180)}
          {dica.detalhe.length > 180 ? "…" : ""}
        </p>
        <Link
          to="/app/missoes"
          className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
          style={{ color: NAVY }}
        >
          ver todas as dicas <ArrowRight className="size-3.5" style={{ color: GOLD }} />
        </Link>
        <Link
          to="/app/guias"
          className="mt-3 ml-4 inline-flex items-center gap-1.5 text-[12.5px]"
          style={{ color: "#5C5749" }}
        >
          guias <ArrowRight className="size-3.5" style={{ color: GOLD }} />
        </Link>
      </section>

      {/* 6. Card do plano — só para quem ainda não comprou */}
      {!pago && (
        <section className="mt-6">
          <Link to="/app/derma" className="block rounded-[24px] px-5 py-5" style={CARD}>
            <p className="text-[10px] font-semibold uppercase" style={{ letterSpacing: "0.24em", color: GOLD }}>
              Plano Zero Lipedema
            </p>
            <p className="mt-1.5 text-[13.5px]" style={{ color: "#2F3128", lineHeight: 1.55 }}>
              A Rotina completa das 4 semanas, registro de refeições por foto sem limite e os guias práticos, por R$67.
            </p>
            <p className="mt-2.5 text-[13px] font-semibold" style={{ color: NAVY }}>
              Ver o plano <span style={{ color: GOLD }}>→</span>
            </p>
          </Link>
        </section>
      )}
    </div>
  );
}
