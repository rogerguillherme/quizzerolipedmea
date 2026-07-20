import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Play, Sparkles } from "lucide-react";
import { getQuiz, setQuiz, setApp, type QuizAnswers } from "../lib/quiz-store";
import { track } from "../lib/analytics";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

type Step =
  | "nome"
  | "tempo"
  | "tentativas"
  | "regioes"
  | "hormonal"
  | "familia"
  | "emocional"
  | "dor"
  | "mapa"
  | "vsl";

const ORDER: Step[] = [
  "nome",
  "tempo",
  "tentativas",
  "regioes",
  "hormonal",
  "familia",
  "emocional",
  "dor",
  "mapa",
  "vsl",
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("nome");
  const [answers, setAnswers] = useState<QuizAnswers>(() => getQuiz());

  useEffect(() => {
    track("quiz_started");
  }, []);

  const stepIndex = ORDER.indexOf(step);
  const quizSteps = ORDER.length - 2; // exclude mapa + vsl from progress bar
  const progress = Math.min(
    100,
    Math.round((Math.min(stepIndex, quizSteps) / quizSteps) * 100),
  );

  function update(patch: Partial<QuizAnswers>) {
    const next = { ...answers, ...patch };
    setAnswers(next);
    setQuiz(patch);
  }

  function goNext() {
    const idx = ORDER.indexOf(step);
    if (idx < ORDER.length - 1) {
      const nextStep = ORDER[idx + 1];
      setStep(nextStep);
      track("quiz_step", { step: nextStep });
      if (nextStep === "mapa") track("quiz_completed");
    }
  }

  function goBack() {
    const idx = ORDER.indexOf(step);
    if (idx > 0) setStep(ORDER[idx - 1]);
    else navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-3">
          <button
            onClick={goBack}
            className="grid size-9 place-items-center rounded-xl text-primary hover:bg-accent"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-sapphire-100">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            {Math.min(stepIndex + 1, quizSteps)}/{quizSteps}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pb-32 pt-6">
        {step === "nome" && <NomeStep value={answers.nome} onChange={(v) => update({ nome: v })} onNext={goNext} />}
        {step === "tempo" && (
          <ChoiceStep
            title="Há quanto tempo você percebe inchaço ou dor nas pernas/braços?"
            help="Não precisa de resposta perfeita — a mais próxima já ajuda."
            options={["Menos de 1 ano", "1 a 3 anos", "3 a 10 anos", "Mais de 10 anos"]}
            value={answers.tempoSintomas}
            onChange={(v) => update({ tempoSintomas: v })}
            onNext={goNext}
          />
        )}
        {step === "tentativas" && (
          <ChoiceStep
            title="Você já tentou dieta ou exercício e sente que não mudou?"
            options={[
              "Sim, várias vezes",
              "Sim, uma ou duas",
              "Mudou um pouco mas voltou",
              "Ainda não tentei sério",
            ]}
            value={answers.tentouDietaExercicio}
            onChange={(v) => update({ tentouDietaExercicio: v })}
            onNext={goNext}
          />
        )}
        {step === "regioes" && (
          <MultiChoiceStep
            title="Onde você mais sente o desconforto?"
            options={["Coxas", "Panturrilhas", "Quadril", "Braços", "Joelhos"]}
            value={answers.regioes || []}
            onChange={(v) => update({ regioes: v })}
            onNext={goNext}
          />
        )}
        {step === "hormonal" && (
          <ChoiceStep
            title="Qual momento hormonal descreve você hoje?"
            options={[
              "Ciclo regular",
              "Após gestação",
              "Perimenopausa",
              "Menopausa",
              "Uso anticoncepcional",
            ]}
            value={answers.hormonal}
            onChange={(v) => update({ hormonal: v })}
            onNext={goNext}
          />
        )}
        {step === "familia" && (
          <ChoiceStep
            title="Há casos parecidos na sua família (mãe, irmã, tia)?"
            options={["Sim", "Não sei", "Não"]}
            value={answers.familia}
            onChange={(v) => update({ familia: v })}
            onNext={goNext}
          />
        )}
        {step === "emocional" && (
          <ChoiceStep
            title="Como isso afeta sua autoestima no dia a dia?"
            options={[
              "Muito — evito fotos, roupas, sair",
              "Bastante, mas convivo",
              "Um pouco",
              "Quase nada",
            ]}
            value={answers.impactoEmocional}
            onChange={(v) => update({ impactoEmocional: v })}
            onNext={goNext}
          />
        )}
        {step === "dor" && (
          <SliderStep
            title="Em um dia comum, qual seu nível de dor/peso nas pernas?"
            value={answers.dorNivel ?? 5}
            onChange={(v) => update({ dorNivel: v })}
            onNext={goNext}
          />
        )}
        {step === "mapa" && <MapaReveal answers={answers} onNext={goNext} />}
        {step === "vsl" && (
          <Vsl
            nome={answers.nome}
            onContinue={() => {
              setApp({ nome: answers.nome });
              navigate({ to: "/protocolo/pagamento" });
            }}
          />
        )}
      </main>
    </div>
  );
}

function NomeStep({
  value,
  onChange,
  onNext,
}: {
  value?: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  const [v, setV] = useState(value || "");
  return (
    <div>
      <h1 className="text-2xl font-extrabold leading-tight text-primary">
        Antes de começar, como você gostaria de ser chamada?
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Só o primeiro nome. Vou usar ao longo da sua jornada.
      </p>
      <input
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Seu primeiro nome"
        className="mt-6 w-full rounded-2xl border border-input bg-card px-5 py-4 text-lg font-semibold text-primary outline-none ring-ring focus:border-ring focus:ring-2"
      />
      <PrimaryButton
        disabled={!v.trim()}
        onClick={() => {
          onChange(v.trim());
          onNext();
        }}
      >
        Continuar
      </PrimaryButton>
    </div>
  );
}

function ChoiceStep({
  title,
  help,
  options,
  value,
  onChange,
  onNext,
}: {
  title: string;
  help?: string;
  options: string[];
  value?: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold leading-tight text-primary">{title}</h1>
      {help && <p className="mt-2 text-sm text-muted-foreground">{help}</p>}
      <div className="mt-6 space-y-3">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setTimeout(onNext, 180);
              }}
              className={[
                "w-full rounded-2xl border px-5 py-4 text-left text-base font-semibold transition-all",
                selected
                  ? "border-primary bg-sapphire-100 text-primary"
                  : "border-border bg-card text-foreground hover:border-sapphire-200 hover:bg-sapphire-50",
              ].join(" ")}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MultiChoiceStep({
  title,
  options,
  value,
  onChange,
  onNext,
}: {
  title: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
}) {
  function toggle(opt: string) {
    if (value.includes(opt)) onChange(value.filter((x) => x !== opt));
    else onChange([...value, opt]);
  }
  return (
    <div>
      <h1 className="text-2xl font-extrabold leading-tight text-primary">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Pode marcar mais de uma.</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const selected = value.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={[
                "rounded-2xl border px-4 py-4 text-center text-sm font-semibold transition-all",
                selected
                  ? "border-primary bg-sapphire-100 text-primary"
                  : "border-border bg-card text-foreground hover:border-sapphire-200",
              ].join(" ")}
            >
              {opt}
            </button>
          );
        })}
      </div>
      <PrimaryButton disabled={value.length === 0} onClick={onNext}>
        Continuar
      </PrimaryButton>
    </div>
  );
}

function SliderStep({
  title,
  value,
  onChange,
  onNext,
}: {
  title: string;
  value: number;
  onChange: (v: number) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold leading-tight text-primary">{title}</h1>
      <div className="mt-8 text-center">
        <span className="text-6xl font-extrabold text-primary tabular-nums">{value}</span>
        <span className="text-2xl font-semibold text-muted-foreground">/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-6 w-full accent-[color:var(--color-primary)]"
      />
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>Sem desconforto</span>
        <span>Dor forte</span>
      </div>
      <PrimaryButton onClick={onNext}>Ver meu Mapa</PrimaryButton>
    </div>
  );
}

function MapaReveal({ answers, onNext }: { answers: QuizAnswers; onNext: () => void }) {
  const highlights = useMemo(() => buildInsights(answers), [answers]);
  const regioes = answers.regioes || [];
  return (
    <div>
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-coral" />
        <p className="text-sm font-bold uppercase tracking-wide text-coral">Seu mapa está pronto</p>
      </div>
      <h1 className="mt-2 text-2xl font-extrabold leading-tight text-primary">
        {answers.nome ? `${answers.nome}, aqui está o retrato do seu caso` : "Aqui está o retrato do seu caso"}
      </h1>

      <div className="card-clinical mt-6 p-5">
        <BodyMap regioes={regioes} />
        <div className="mt-4 flex flex-wrap gap-2">
          {regioes.map((r) => (
            <span
              key={r}
              className="rounded-full bg-sapphire-100 px-3 py-1 text-xs font-semibold text-sapphire-800"
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {highlights.map((h, i) => (
          <div key={i} className="card-clinical p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-sapphire-600">
              {h.label}
            </p>
            <p className="mt-1 text-[15px] leading-snug text-foreground">{h.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-sapphire-200 bg-sapphire-50 p-4">
        <p className="text-sm font-semibold text-primary">
          O próximo passo é entender por que isso acontece com você.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Preparei um vídeo curto explicando o gatilho hormonal/inflamatório e o
          caminho de 7 dias.
        </p>
      </div>

      <PrimaryButton onClick={onNext}>
        <Play className="size-4" /> Ver vídeo da Gabriela
      </PrimaryButton>
    </div>
  );
}

function buildInsights(a: QuizAnswers): { label: string; text: string }[] {
  const out: { label: string; text: string }[] = [];
  if (a.tentouDietaExercicio && a.tentouDietaExercicio.toLowerCase().includes("sim")) {
    out.push({
      label: "Isso não é falta de força de vontade",
      text: "Você já tentou dieta e treino sem retorno proporcional. Isso é típico de lipedema: o tecido responde diferente do tecido adiposo comum.",
    });
  }
  if (a.tempoSintomas) {
    out.push({
      label: "Tempo de convivência",
      text: `Você convive com esses sintomas há ${a.tempoSintomas.toLowerCase()}. Isso muda o ponto de partida do protocolo.`,
    });
  }
  if (a.hormonal) {
    const map: Record<string, string> = {
      "Ciclo regular": "Mesmo com ciclo regular, oscilações hormonais amplificam retenção e dor.",
      "Após gestação": "Gestação é um dos gatilhos clássicos de piora do lipedema.",
      Perimenopausa: "Perimenopausa reduz progesterona — um dos motores principais do quadro.",
      Menopausa: "Na menopausa, o padrão inflamatório e vascular pede um plano específico.",
      "Uso anticoncepcional": "Anticoncepcional pode influenciar retenção e sensibilidade do tecido.",
    };
    out.push({ label: "Camada hormonal", text: map[a.hormonal] || "Contexto hormonal considerado." });
  }
  if ((a.dorNivel ?? 0) >= 6) {
    out.push({
      label: "Nível de dor relevante",
      text: "Sua dor está em patamar que merece prioridade no plano. Não é normal e não é frescura.",
    });
  }
  if (a.impactoEmocional && a.impactoEmocional.toLowerCase().startsWith("muito")) {
    out.push({
      label: "Impacto emocional",
      text: "Você marcou que evita fotos, roupas ou sair. Isso entra no plano — não é vaidade, é qualidade de vida.",
    });
  }
  if (out.length === 0)
    out.push({
      label: "Ponto de partida",
      text: "Suas respostas foram registradas. Vamos começar o plano com base nelas.",
    });
  return out;
}

function BodyMap({ regioes }: { regioes: string[] }) {
  const active = (r: string) => regioes.includes(r);
  return (
    <svg viewBox="0 0 200 320" className="mx-auto h-56 w-auto">
      {/* head */}
      <circle cx="100" cy="30" r="18" fill="var(--color-sapphire-100)" stroke="var(--color-sapphire-200)" />
      {/* torso */}
      <path
        d="M75 55 Q100 50 125 55 L130 130 Q100 138 70 130 Z"
        fill="var(--color-sapphire-100)"
        stroke="var(--color-sapphire-200)"
      />
      {/* arms */}
      <path
        d="M75 60 L55 120 L60 145 L72 130 Z"
        fill={active("Braços") ? "var(--color-coral-soft)" : "var(--color-sapphire-100)"}
        stroke={active("Braços") ? "var(--color-coral)" : "var(--color-sapphire-200)"}
        strokeWidth={active("Braços") ? 2 : 1}
      />
      <path
        d="M125 60 L145 120 L140 145 L128 130 Z"
        fill={active("Braços") ? "var(--color-coral-soft)" : "var(--color-sapphire-100)"}
        stroke={active("Braços") ? "var(--color-coral)" : "var(--color-sapphire-200)"}
        strokeWidth={active("Braços") ? 2 : 1}
      />
      {/* hip */}
      <path
        d="M70 130 Q100 138 130 130 L128 165 Q100 175 72 165 Z"
        fill={active("Quadril") ? "var(--color-coral-soft)" : "var(--color-sapphire-100)"}
        stroke={active("Quadril") ? "var(--color-coral)" : "var(--color-sapphire-200)"}
        strokeWidth={active("Quadril") ? 2 : 1}
      />
      {/* thighs */}
      <path
        d="M72 165 L80 235 L98 235 L100 168 Z"
        fill={active("Coxas") ? "var(--color-coral-soft)" : "var(--color-sapphire-100)"}
        stroke={active("Coxas") ? "var(--color-coral)" : "var(--color-sapphire-200)"}
        strokeWidth={active("Coxas") ? 2 : 1}
      />
      <path
        d="M100 168 L102 235 L120 235 L128 165 Z"
        fill={active("Coxas") ? "var(--color-coral-soft)" : "var(--color-sapphire-100)"}
        stroke={active("Coxas") ? "var(--color-coral)" : "var(--color-sapphire-200)"}
        strokeWidth={active("Coxas") ? 2 : 1}
      />
      {/* knees */}
      <ellipse
        cx="89"
        cy="238"
        rx="10"
        ry="6"
        fill={active("Joelhos") ? "var(--color-coral-soft)" : "var(--color-sapphire-100)"}
        stroke={active("Joelhos") ? "var(--color-coral)" : "var(--color-sapphire-200)"}
      />
      <ellipse
        cx="111"
        cy="238"
        rx="10"
        ry="6"
        fill={active("Joelhos") ? "var(--color-coral-soft)" : "var(--color-sapphire-100)"}
        stroke={active("Joelhos") ? "var(--color-coral)" : "var(--color-sapphire-200)"}
      />
      {/* calves */}
      <path
        d="M82 244 L88 305 L98 305 L96 244 Z"
        fill={active("Panturrilhas") ? "var(--color-coral-soft)" : "var(--color-sapphire-100)"}
        stroke={active("Panturrilhas") ? "var(--color-coral)" : "var(--color-sapphire-200)"}
        strokeWidth={active("Panturrilhas") ? 2 : 1}
      />
      <path
        d="M104 244 L102 305 L112 305 L118 244 Z"
        fill={active("Panturrilhas") ? "var(--color-coral-soft)" : "var(--color-sapphire-100)"}
        stroke={active("Panturrilhas") ? "var(--color-coral)" : "var(--color-sapphire-200)"}
        strokeWidth={active("Panturrilhas") ? 2 : 1}
      />
    </svg>
  );
}

function Vsl({ nome, onContinue }: { nome?: string; onContinue: () => void }) {
  const [playing, setPlaying] = useState(false);
  const VSL_SECONDS = 180; // 3 minutes simulated
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const start = Date.now();
    const marked = new Set<number>();
    const id = setInterval(() => {
      const e = (Date.now() - start) / 1000;
      setElapsed(e);
      const pct = Math.min(100, Math.round((e / VSL_SECONDS) * 100));
      [25, 50, 75, 100].forEach((m) => {
        if (pct >= m && !marked.has(m)) {
          marked.add(m);
          track("vsl_progress", { percent: m });
        }
      });
      if (pct >= 100) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [playing]);

  const pct = Math.min(100, Math.round((elapsed / VSL_SECONDS) * 100));

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-wide text-coral">Vídeo · 3 min</p>
      <h1 className="mt-1 text-2xl font-extrabold leading-tight text-primary">
        {nome ? `${nome}, o que o seu Mapa está dizendo` : "O que o seu Mapa está dizendo"}
      </h1>

      <button
        onClick={() => setPlaying(true)}
        className="card-clinical relative mt-6 aspect-video w-full overflow-hidden bg-gradient-to-br from-sapphire-800 to-sapphire-600"
      >
        <div className="absolute inset-0 grid place-items-center">
          {!playing ? (
            <div className="grid size-20 place-items-center rounded-full bg-coral text-coral-foreground shadow-2xl">
              <Play className="size-8 fill-current" />
            </div>
          ) : (
            <div className="animate-pulse text-primary-foreground">Reproduzindo…</div>
          )}
        </div>
        <div className="absolute bottom-3 left-3 rounded-md bg-black/40 px-2 py-0.5 text-[11px] font-semibold text-white">
          Gabriela Rosado · CRN 10582
        </div>
        {playing && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
            <div
              className="h-full bg-coral transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </button>

      <ul className="mt-6 space-y-2 text-sm text-foreground">
        <li>• Por que dieta e treino sozinhos não resolvem</li>
        <li>• A camada hormonal e inflamatória do lipedema</li>
        <li>• O que muda em 7 dias com o protocolo certo</li>
      </ul>

      <PrimaryButton onClick={onContinue}>
        Quero o Desafio de 7 dias <ArrowRight className="size-4" />
      </PrimaryButton>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Você verá o preço e a garantia na próxima tela.
      </p>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-coral px-5 py-4 text-base font-bold text-coral-foreground shadow-lg shadow-coral/20 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
