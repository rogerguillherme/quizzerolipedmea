import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Save,
  Upload,
  Check,
} from "lucide-react";
import {
  getPremiumOnboarding,
  salvarAnamnese,
  type AnamnesePayload,
} from "@/lib/anamnese.functions";

export const Route = createFileRoute("/app/anamnese")({
  component: AnamnesePage,
  head: () => ({
    meta: [
      { title: "Anamnese Premium · Zero Lipedema" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Field = {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
};

type Bloco = {
  id: keyof AnamnesePayload;
  titulo: string;
  intro: string;
  campos: Field[];
};

const BLOCOS: Bloco[] = [
  {
    id: "identificacao",
    titulo: "Sobre você",
    intro: "Vamos começar por dados básicos — nada por aqui é obrigatório, mas quanto mais eu souber, mais personalizado fica.",
    campos: [
      { key: "idade", label: "Idade", placeholder: "ex.: 38" },
      { key: "peso", label: "Peso atual (kg)", placeholder: "ex.: 78" },
      { key: "altura", label: "Altura (cm)", placeholder: "ex.: 165" },
      { key: "cidade", label: "Cidade / Estado", placeholder: "ex.: Curitiba - PR" },
    ],
  },
  {
    id: "queixa",
    titulo: "Sua queixa principal",
    intro: "Me conta com suas palavras o que mais te incomoda hoje.",
    campos: [
      { key: "principal", label: "Queixa principal", multiline: true, placeholder: "ex.: pernas pesadas, doloridas, inchadas ao final do dia" },
      { key: "tempo", label: "Há quanto tempo?", placeholder: "ex.: 6 anos" },
      { key: "piora", label: "O que piora?", multiline: true, placeholder: "ex.: calor, ficar em pé muito tempo, TPM" },
      { key: "alivio", label: "O que alivia?", multiline: true, placeholder: "ex.: elevar as pernas, meia de compressão" },
    ],
  },
  {
    id: "historico",
    titulo: "Histórico clínico",
    intro: "Se já teve algum diagnóstico ou tratamento, registre aqui.",
    campos: [
      { key: "diagnosticoMedico", label: "Já foi diagnosticada por médico?", placeholder: "ex.: sim, angiologista em 2022" },
      { key: "estagio", label: "Estágio do lipedema (se souber)", placeholder: "ex.: 1, 2, 3 ou não sei" },
      { key: "tratamentosJaFeitos", label: "Tratamentos que já fez", multiline: true, placeholder: "ex.: drenagem, compressão, dieta cetogênica…" },
      { key: "cirurgias", label: "Cirurgias relevantes", multiline: true, placeholder: "ex.: lipoaspiração em 2019" },
    ],
  },
  {
    id: "ginecologico",
    titulo: "Saúde hormonal",
    intro: "Hormônios influenciam muito o lipedema.",
    campos: [
      { key: "ciclo", label: "Ciclo menstrual", placeholder: "ex.: regular, 28 dias / irregular / ausente" },
      { key: "anticoncepcional", label: "Anticoncepcional / TRH", placeholder: "ex.: pílula combinada há 3 anos" },
      { key: "gestacoes", label: "Gestações", placeholder: "ex.: 2 filhos" },
      { key: "menopausa", label: "Menopausa?", placeholder: "ex.: não / peri / sim aos 49" },
    ],
  },
  {
    id: "medicamentos",
    titulo: "Medicamentos e alergias",
    intro: "Tudo que você toma hoje, contínuo ou frequente.",
    campos: [
      { key: "usoContinuo", label: "Uso contínuo", multiline: true, placeholder: "ex.: levotiroxina 50mcg" },
      { key: "suplementos", label: "Suplementos", multiline: true, placeholder: "ex.: vitamina D, magnésio" },
      { key: "alergias", label: "Alergias / intolerâncias", multiline: true, placeholder: "ex.: lactose" },
    ],
  },
  {
    id: "familiar",
    titulo: "Histórico familiar",
    intro: "Lipedema tem forte componente genético.",
    campos: [
      { key: "lipedema", label: "Lipedema na família", placeholder: "ex.: mãe e tia" },
      { key: "obesidade", label: "Obesidade", placeholder: "ex.: mãe" },
      { key: "varizes", label: "Varizes / problemas circulatórios", placeholder: "ex.: pai" },
      { key: "tireoide", label: "Tireoide", placeholder: "ex.: mãe hipotireoidismo" },
    ],
  },
  {
    id: "alimentar",
    titulo: "Rotina alimentar",
    intro: "Como é um dia comum de comida na sua rotina real (não a ideal).",
    campos: [
      { key: "cafe", label: "Café da manhã", multiline: true },
      { key: "almoco", label: "Almoço", multiline: true },
      { key: "lanche", label: "Lanche da tarde", multiline: true },
      { key: "jantar", label: "Jantar", multiline: true },
      { key: "agua", label: "Água por dia", placeholder: "ex.: 1,5L" },
      { key: "alcool", label: "Álcool", placeholder: "ex.: 2x por semana" },
      { key: "acucar", label: "Açúcar / doces", placeholder: "ex.: todo dia" },
      { key: "ultraprocessados", label: "Ultraprocessados", placeholder: "ex.: biscoitos, embutidos" },
    ],
  },
  {
    id: "intestinal",
    titulo: "Intestino",
    intro: "O intestino conversa direto com a inflamação.",
    campos: [
      { key: "frequencia", label: "Frequência", placeholder: "ex.: todo dia / 3x semana" },
      { key: "forma", label: "Forma das fezes", placeholder: "ex.: normal / ressecada / pastosa" },
      { key: "inchaco", label: "Inchaço abdominal / gases", multiline: true },
    ],
  },
  {
    id: "sono_estresse",
    titulo: "Sono e estresse",
    intro: "Cortisol alto piora o inchaço.",
    campos: [
      { key: "horas", label: "Horas de sono", placeholder: "ex.: 6h" },
      { key: "qualidade", label: "Qualidade", placeholder: "ex.: acordo cansada" },
      { key: "estresse", label: "Nível de estresse hoje", multiline: true },
    ],
  },
  {
    id: "atividade",
    titulo: "Atividade física",
    intro: "Movimento certo é remédio para lipedema.",
    campos: [
      { key: "pratica", label: "O que pratica?", placeholder: "ex.: caminhada, musculação" },
      { key: "frequencia", label: "Frequência", placeholder: "ex.: 3x/semana" },
      { key: "limitacoes", label: "Dores ou limitações", multiline: true },
    ],
  },
  {
    id: "objetivo",
    titulo: "Seu objetivo com o Premium",
    intro: "Por último — onde você quer chegar nesses 30 dias?",
    campos: [
      { key: "principal", label: "Objetivo principal", multiline: true, placeholder: "ex.: reduzir inchaço, dor e melhorar disposição" },
      { key: "prazo", label: "Prazo desejado", placeholder: "ex.: 30 dias" },
      { key: "expectativa", label: "O que espera receber de mim", multiline: true },
    ],
  },
];

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const CREAM = "#F5EFE1";

function AnamnesePage() {
  const getStatus = useServerFn(getPremiumOnboarding);
  const salvar = useServerFn(salvarAnamnese);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: st, isLoading } = useQuery({
    queryKey: ["premium-onboarding"],
    queryFn: () => getStatus(),
  });

  const initial = (st?.anamnese ?? {}) as Record<string, Record<string, string>>;
  const [step, setStep] = useState(0);
  const [state, setState] = useState<Record<string, Record<string, string>>>({});
  const merged = useMemo(() => {
    const out: Record<string, Record<string, string>> = {};
    for (const b of BLOCOS) {
      out[b.id] = { ...(initial[b.id] ?? {}), ...(state[b.id] ?? {}) };
    }
    return out;
    // initial só muda quando o servidor atualiza; state controla edições atuais
  }, [initial, state]);

  const bloco = BLOCOS[step];
  const last = step === BLOCOS.length - 1;

  const salvarMut = useMutation({
    mutationFn: (opts: { concluir: boolean }) =>
      salvar({ data: { payload: merged as AnamnesePayload, concluir: opts.concluir } }),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["premium-onboarding"] });
      if (vars.concluir) {
        navigate({ to: "/app/exames" });
      }
    },
  });

  const setCampo = (blocoId: string, campo: string, valor: string) => {
    setState((s) => ({
      ...s,
      [blocoId]: { ...(s[blocoId] ?? {}), [campo]: valor },
    }));
  };

  if (isLoading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Loader2 className="size-6 animate-spin" style={{ color: NAVY }} />
      </div>
    );
  }

  if (!st?.isPremium) {
    return (
      <div className="px-5 pt-6 pb-24">
        <div
          className="rounded-3xl p-6 text-center"
          style={{ background: "rgba(255,253,247,0.9)", border: "1px solid rgba(216,198,160,0.6)" }}
        >
          <p className="text-sm text-[#3E4F65]">
            A anamnese completa faz parte do <strong>Plano Premium</strong>. Assine para liberar.
          </p>
          <Link
            to="/app/derma"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            style={{ background: NAVY, color: CREAM }}
          >
            Ver Plano Premium <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  const progresso = Math.round(((step + 1) / BLOCOS.length) * 100);

  return (
    <div className="px-5 pb-28 pt-4">
      <Link
        to="/app/derma"
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em]"
        style={{ color: GOLD }}
      >
        <ArrowLeft className="size-3.5" /> Voltar
      </Link>

      <header className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>
          Passo 1 de 2 · Anamnese
        </p>
        <h1
          className="mt-1 text-2xl italic leading-tight"
          style={{ fontFamily: "'Playfair Display', serif", color: NAVY }}
        >
          {bloco.titulo}
        </h1>
        <p className="mt-1 text-sm text-[#3E4F65]">{bloco.intro}</p>
      </header>

      {/* Progresso */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[#EFE3CC]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progresso}%`, background: `linear-gradient(90deg, ${GOLD}, #E7BE5C)` }}
        />
      </div>
      <p className="mb-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A7C5C]">
        {step + 1} / {BLOCOS.length}
      </p>

      <section
        className="rounded-3xl p-5"
        style={{
          background: "linear-gradient(180deg,#FBF6E9,#FFFDF7)",
          border: "1px solid rgba(216,198,160,0.6)",
          boxShadow: "0 10px 26px -18px rgba(22,50,79,0.35)",
        }}
      >
        <div className="space-y-3">
          {bloco.campos.map((c) => {
            const val = merged[bloco.id]?.[c.key] ?? "";
            return (
              <label key={c.key} className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#5C5749]">
                  {c.label}
                </span>
                {c.multiline ? (
                  <textarea
                    value={val}
                    onChange={(e) => setCampo(bloco.id, c.key, e.target.value.slice(0, c.maxLength ?? 500))}
                    placeholder={c.placeholder}
                    className="w-full rounded-2xl border bg-white/80 p-3 text-sm text-[#16324F] placeholder:text-[#8A7C5C] outline-none focus:border-[#AF7F35]"
                    style={{ borderColor: "rgba(216,198,160,0.7)", minHeight: 80 }}
                  />
                ) : (
                  <input
                    value={val}
                    onChange={(e) => setCampo(bloco.id, c.key, e.target.value.slice(0, c.maxLength ?? 120))}
                    placeholder={c.placeholder}
                    className="w-full rounded-2xl border bg-white/80 p-3 text-sm text-[#16324F] placeholder:text-[#8A7C5C] outline-none focus:border-[#AF7F35]"
                    style={{ borderColor: "rgba(216,198,160,0.7)" }}
                  />
                )}
              </label>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || salvarMut.isPending}
            className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-xs font-semibold disabled:opacity-40"
            style={{ borderColor: "rgba(216,198,160,0.8)", color: NAVY }}
          >
            <ArrowLeft className="size-3.5" /> Voltar
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => salvarMut.mutate({ concluir: false })}
              disabled={salvarMut.isPending}
              className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-xs font-semibold disabled:opacity-40"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              {salvarMut.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Salvar rascunho
            </button>
            {!last && (
              <button
                onClick={() => {
                  salvarMut.mutate({ concluir: false });
                  setStep((s) => Math.min(BLOCOS.length - 1, s + 1));
                }}
                disabled={salvarMut.isPending}
                className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] disabled:opacity-40"
                style={{
                  background: `linear-gradient(180deg,#E7BE5C,${GOLD})`,
                  color: NAVY,
                }}
              >
                Próximo <ArrowRight className="size-3.5" />
              </button>
            )}
            {last && (
              <button
                onClick={() => salvarMut.mutate({ concluir: true })}
                disabled={salvarMut.isPending}
                className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] disabled:opacity-40"
                style={{
                  background: `linear-gradient(180deg,${NAVY},#0E2439)`,
                  color: CREAM,
                }}
              >
                {salvarMut.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                Concluir e ir para exames
              </button>
            )}
          </div>
        </div>
      </section>

      {st.anamneseCompleta && (
        <div
          className="mt-4 flex items-center justify-between gap-2 rounded-2xl border p-3 text-xs"
          style={{
            borderColor: "rgba(46,125,50,0.35)",
            background: "rgba(221,235,216,0.5)",
            color: "#2E7D32",
          }}
        >
          <span className="inline-flex items-center gap-1 font-semibold">
            <CheckCircle2 className="size-4" /> Anamnese já concluída — você pode revisar quando quiser.
          </span>
          <Link
            to="/app/exames"
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold"
            style={{ background: "#2E7D32", color: "#F5F7F5" }}
          >
            Ir para exames <Upload className="size-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
