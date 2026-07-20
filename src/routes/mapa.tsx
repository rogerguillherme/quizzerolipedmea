import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Activity,
  Heart,
} from "lucide-react";
import { submitMapa, type Diagnostico } from "../lib/mapa.functions";
import { track } from "../lib/analytics";

// Número do WhatsApp da Gabriela (formato internacional, sem "+").
// Trocar por env quando integrar Evolution API.
const WHATSAPP_NUMBER = "5511999999999";

export const Route = createFileRoute("/mapa")({
  component: MapaPage,
  head: () => ({
    meta: [
      { title: "Mapa do Lipedema — 6 perguntas para sua leitura" },
      {
        name: "description",
        content:
          "Responda 6 perguntas rápidas e receba, no seu WhatsApp, a leitura personalizada do seu lipedema feita pela IA da Gabriela Rosado.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Answers = {
  nome: string;
  idade: string;
  telefone: string;
  tempoSintomas: string;
  regioes: string[];
  dorNivel: number;
  hormonal: string;
  familia: string;
  tentouDietaExercicio: string;
  impactoEmocional: string;
  inchaco: string;
  hematomas: string;
};

type Step =
  | "boas-vindas"
  | "nome"
  | "tempo"
  | "regioes"
  | "dor"
  | "hormonal"
  | "familia"
  | "tentativas"
  | "impacto"
  | "inchaco"
  | "hematomas"
  | "contato"
  | "gerando"
  | "resultado";

const QUESTION_STEPS: Step[] = [
  "nome",
  "tempo",
  "regioes",
  "dor",
  "hormonal",
  "familia",
  "tentativas",
  "impacto",
  "inchaco",
  "hematomas",
  "contato",
];

function MapaPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("boas-vindas");
  const [answers, setAnswers] = useState<Answers>({
    nome: "",
    idade: "",
    telefone: "",
    tempoSintomas: "",
    regioes: [],
    dorNivel: 5,
    hormonal: "",
    familia: "",
    tentouDietaExercicio: "",
    impactoEmocional: "",
    inchaco: "",
    hematomas: "",
  });
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const submit = useServerFn(submitMapa);

  useEffect(() => {
    if (step === "boas-vindas") track("landing_view");
    if (step === "nome") track("quiz_started");
  }, [step]);

  const questionIndex = QUESTION_STEPS.indexOf(step);
  const showProgress = questionIndex >= 0;
  const progress = showProgress
    ? Math.round(((questionIndex + 1) / QUESTION_STEPS.length) * 100)
    : 0;

  function update<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  function next(target: Step) {
    setStep(target);
  }

  function back() {
    if (step === "boas-vindas") return navigate({ to: "/" });
    const flow: Step[] = ["boas-vindas", ...QUESTION_STEPS];
    const i = flow.indexOf(step);
    if (i > 0) setStep(flow[i - 1]);
  }

  async function handleSubmit() {
    setErro(null);
    setStep("gerando");
    try {
      const result = await submit({
        data: {
          nome: answers.nome.trim(),
          telefone: answers.telefone.trim(),
          idade: answers.idade ? Number(answers.idade) : undefined,
          respostas: {
            tempoSintomas: answers.tempoSintomas,
            regioes: answers.regioes,
            dorNivel: answers.dorNivel,
            hormonal: answers.hormonal,
            familia: answers.familia,
            tentouDietaExercicio: answers.tentouDietaExercicio,
            impactoEmocional: answers.impactoEmocional,
            inchaco: answers.inchaco || undefined,
            hematomas: answers.hematomas || undefined,
          },
        },
      });
      setDiagnostico(result.diagnostico);
      track("quiz_completed");
      setStep("resultado");
    } catch (e) {
      console.error(e);
      setErro(
        "Não consegui gerar seu Mapa agora. Tente novamente em alguns segundos — se persistir, siga direto para o WhatsApp da Gabriela.",
      );
      setStep("contato");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {step !== "gerando" && step !== "resultado" && (
        <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-3">
            <button
              onClick={back}
              className="grid size-9 place-items-center rounded-xl text-primary hover:bg-accent"
              aria-label="Voltar"
            >
              <ArrowLeft className="size-5" />
            </button>
            {showProgress ? (
              <>
                <div className="flex-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-sapphire-100">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                  {questionIndex + 1}/{QUESTION_STEPS.length}
                </span>
              </>
            ) : (
              <p className="text-sm font-bold text-primary">Mapa do Lipedema</p>
            )}
          </div>
        </header>
      )}

      <main className="mx-auto max-w-md px-5 pb-24 pt-6">
        {step === "boas-vindas" && (
          <Welcome
            onStart={() => next("nome")}
          />
        )}

        {step === "nome" && (
          <NomeIdadeStep
            nome={answers.nome}
            idade={answers.idade}
            onChange={(nome, idade) => {
              update("nome", nome);
              update("idade", idade);
            }}
            onNext={() => next("tempo")}
          />
        )}

        {step === "tempo" && (
          <ChoiceStep
            title="Há quanto tempo você percebe inchaço, peso ou dor nas pernas ou braços?"
            options={[
              "Menos de 1 ano",
              "1 a 3 anos",
              "3 a 10 anos",
              "Mais de 10 anos",
            ]}
            value={answers.tempoSintomas}
            onChange={(v) => update("tempoSintomas", v)}
            onNext={() => next("regioes")}
          />
        )}

        {step === "regioes" && (
          <MultiChoiceStep
            title="Onde você sente o desconforto?"
            help="Pode marcar mais de uma."
            options={["Coxas", "Panturrilhas", "Quadril", "Braços", "Joelhos"]}
            value={answers.regioes}
            onChange={(v) => update("regioes", v)}
            onNext={() => next("dor")}
          />
        )}

        {step === "dor" && (
          <SliderStep
            title="Em um dia comum, qual seu nível de dor ou peso nas pernas?"
            value={answers.dorNivel}
            onChange={(v) => update("dorNivel", v)}
            onNext={() => next("hormonal")}
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
              "Não sei dizer",
            ]}
            value={answers.hormonal}
            onChange={(v) => update("hormonal", v)}
            onNext={() => next("familia")}
          />
        )}

        {step === "familia" && (
          <ChoiceStep
            title="Alguém na sua família (mãe, irmã, tia) tem pernas ou braços parecidos com os seus?"
            options={["Sim, várias", "Sim, uma pessoa", "Não sei", "Não"]}
            value={answers.familia}
            onChange={(v) => update("familia", v)}
            onNext={() => next("tentativas")}
          />
        )}

        {step === "tentativas" && (
          <ChoiceStep
            title="Você já tentou dieta ou exercício sem o resultado esperado?"
            options={[
              "Sim, várias vezes",
              "Sim, uma ou duas",
              "Mudou um pouco mas voltou",
              "Ainda não tentei sério",
            ]}
            value={answers.tentouDietaExercicio}
            onChange={(v) => update("tentouDietaExercicio", v)}
            onNext={() => next("impacto")}
          />
        )}

        {step === "impacto" && (
          <ChoiceStep
            title="Como o seu corpo hoje afeta sua autoestima?"
            options={[
              "Muito — evito fotos, roupas, sair",
              "Bastante, mas convivo",
              "Um pouco",
              "Quase nada",
            ]}
            value={answers.impactoEmocional}
            onChange={(v) => update("impactoEmocional", v)}
            onNext={() => next("inchaco")}
          />
        )}

        {step === "inchaco" && (
          <ChoiceStep
            title="Seu inchaço piora ao longo do dia?"
            help="Pense em como você acorda x como termina o dia."
            options={[
              "Sim, muito ao fim do dia",
              "Piora um pouco",
              "Fica praticamente igual",
              "Não tenho inchaço",
            ]}
            value={answers.inchaco}
            onChange={(v) => update("inchaco", v)}
            onNext={() => next("hematomas")}
          />
        )}

        {step === "hematomas" && (
          <ChoiceStep
            title="Você faz hematomas (roxos) com facilidade nas pernas?"
            options={["Sim, muito fácil", "Às vezes", "Raramente", "Nunca"]}
            value={answers.hematomas}
            onChange={(v) => update("hematomas", v)}
            onNext={() => next("contato")}
          />
        )}

        {step === "contato" && (
          <ContatoStep
            telefone={answers.telefone}
            onChange={(v) => update("telefone", v)}
            onSubmit={handleSubmit}
            erro={erro}
          />
        )}

        {step === "gerando" && <Gerando nome={answers.nome} />}

        {step === "resultado" && diagnostico && (
          <Resultado
            nome={answers.nome}
            telefone={answers.telefone}
            diagnostico={diagnostico}
          />
        )}
      </main>
    </div>
  );
}

// ---------- Steps ----------------------------------------------------------

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full bg-sapphire-100 px-3 py-1 text-xs font-semibold text-sapphire-800">
        <Sparkles className="size-3.5" /> Sua leitura leva 2 minutos
      </span>
      <h1 className="mt-4 text-3xl font-extrabold leading-tight text-primary">
        Vamos montar o Mapa do seu Lipedema.
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        Respire fundo. Não precisa saber tudo — as respostas mais próximas já
        me ajudam a montar sua leitura. No final você recebe o resultado no
        seu WhatsApp, com o próximo passo direto da Gabriela.
      </p>

      <div className="mt-6 space-y-2">
        <Bullet icon={<Activity className="size-4" />} text="6 perguntas rápidas + leitura personalizada" />
        <Bullet icon={<Heart className="size-4" />} text="Tom acolhedor, sem julgamento" />
        <Bullet icon={<ShieldCheck className="size-4" />} text="Suas respostas ficam protegidas" />
      </div>

      <PrimaryButton onClick={onStart}>
        Começar meu Mapa <ArrowRight className="size-4" />
      </PrimaryButton>
      <Link
        to="/"
        className="mt-3 block text-center text-xs text-muted-foreground underline"
      >
        Voltar
      </Link>
    </div>
  );
}

function Bullet({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-foreground">
      <span className="grid size-7 place-items-center rounded-lg bg-sapphire-100 text-sapphire-800">
        {icon}
      </span>
      {text}
    </div>
  );
}

function NomeIdadeStep({
  nome,
  idade,
  onChange,
  onNext,
}: {
  nome: string;
  idade: string;
  onChange: (nome: string, idade: string) => void;
  onNext: () => void;
}) {
  const [n, setN] = useState(nome);
  const [i, setI] = useState(idade);
  return (
    <div>
      <h1 className="text-2xl font-extrabold leading-tight text-primary">
        Antes de tudo: como você quer ser chamada?
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Só o primeiro nome já basta.
      </p>
      <input
        autoFocus
        value={n}
        onChange={(e) => setN(e.target.value)}
        placeholder="Seu primeiro nome"
        className="mt-6 w-full rounded-2xl border border-input bg-card px-5 py-4 text-lg font-semibold text-primary outline-none ring-ring focus:border-ring focus:ring-2"
      />
      <input
        value={i}
        inputMode="numeric"
        maxLength={2}
        onChange={(e) => setI(e.target.value.replace(/\D/g, ""))}
        placeholder="Sua idade (opcional)"
        className="mt-3 w-full rounded-2xl border border-input bg-card px-5 py-4 text-base text-foreground outline-none ring-ring focus:border-ring focus:ring-2"
      />
      <PrimaryButton
        disabled={n.trim().length < 2}
        onClick={() => {
          onChange(n.trim(), i);
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
  value: string;
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
  help,
  options,
  value,
  onChange,
  onNext,
}: {
  title: string;
  help?: string;
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
      {help && <p className="mt-2 text-sm text-muted-foreground">{help}</p>}
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
      <PrimaryButton onClick={onNext}>Continuar</PrimaryButton>
    </div>
  );
}

function ContatoStep({
  telefone,
  onChange,
  onSubmit,
  erro,
}: {
  telefone: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  erro: string | null;
}) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold leading-tight text-primary">
        Para onde eu envio seu Mapa?
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Seu WhatsApp. Assim a Gabriela consegue te enviar a leitura completa e
        o primeiro passo do protocolo — sem prometer nada que não possa
        cumprir.
      </p>

      <input
        autoFocus
        inputMode="tel"
        value={telefone}
        onChange={(e) => onChange(e.target.value)}
        placeholder="(11) 9 8888-7777"
        className="mt-6 w-full rounded-2xl border border-input bg-card px-5 py-4 text-lg font-semibold text-primary outline-none ring-ring focus:border-ring focus:ring-2"
      />

      <p className="mt-3 text-[11px] text-muted-foreground">
        Ao continuar, você concorda em receber contato pelo WhatsApp. Sem spam.
      </p>

      {erro && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      <PrimaryButton disabled={telefone.trim().length < 8} onClick={onSubmit}>
        Gerar meu Mapa <Sparkles className="size-4" />
      </PrimaryButton>
    </div>
  );
}

function Gerando({ nome }: { nome: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-sapphire-100 text-primary">
          <Loader2 className="size-8 animate-spin" />
        </div>
        <p className="mt-6 text-xl font-extrabold text-primary">
          {nome ? `${nome}, estou lendo suas respostas…` : "Lendo suas respostas…"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Montando seu Mapa personalizado com a IA da Gabriela. Leva alguns
          segundos.
        </p>
      </div>
    </div>
  );
}

function Resultado({
  nome,
  telefone,
  diagnostico,
}: {
  nome: string;
  telefone: string;
  diagnostico: Diagnostico;
}) {
  const primeiroNome = nome.split(" ")[0];
  const waMessage = encodeURIComponent(
    `Oi Gabriela! Sou a ${primeiroNome}. Acabei de fazer o Mapa do Lipedema e quero receber meu acesso ao app + o próximo passo.`,
  );
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

  function onWhatsappClick() {
    track("purchase_completed", {
      step: "mapa_to_whatsapp",
      telefone,
    });
  }

  const habitos = diagnostico.habitos ?? [];

  return (
    <div className="-mx-5 -mt-4">
      {/* Card superior — perfil em gradiente azul */}
      <div className="relative overflow-hidden rounded-b-[40px] bg-gradient-to-br from-[#2C6FEA] to-[#0B2A4A] px-8 pb-12 pt-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10">
          <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
            Seu Perfil
          </span>
          <h1
            className="mt-3 text-4xl leading-[1.05] tracking-tight text-white"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
          >
            {diagnostico.perfil || "Mapa em Análise"}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/90">
            {diagnostico.resumo}
          </p>

          <div className="mt-7 rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-md">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-white/80">
              Primeira Missão
            </span>
            <h3
              className="mt-1 text-lg tracking-tight text-white"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              {diagnostico.primeiraMissao}
            </h3>
          </div>
        </div>
      </div>

      {/* Radar dos hábitos */}
      <div className="bg-white px-8 pb-2 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#0B2A4A]">
            Radar dos seus hábitos
          </h2>
          <div className="h-1 w-10 rounded-full bg-[#2C6FEA]/20" />
        </div>

        <div className="space-y-5">
          {habitos.map((h) => (
            <div key={h.chave} className="space-y-2">
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-[#0B2A4A]/60">
                <span>{h.label}</span>
                <span className="text-[#2C6FEA]">{h.score}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAF1FB]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2C6FEA] to-[#0B2A4A]"
                  style={{ width: `${Math.max(0, Math.min(100, h.score))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detalhes clínicos leves */}
      <div className="px-8 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#2C6FEA]">
          Estágio provável
        </p>
        <p
          className="mt-1 text-xl tracking-tight text-[#0B2A4A]"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
        >
          {diagnostico.estagioProvavel}
        </p>

        {diagnostico.pontosChave?.length > 0 && (
          <Section title="Pontos-chave do seu Mapa">
            {diagnostico.pontosChave.map((p, i) => (
              <Bullet2 key={i} text={p} />
            ))}
          </Section>
        )}

        {diagnostico.gatilhos?.length > 0 && (
          <Section title="Gatilhos que identifiquei">
            {diagnostico.gatilhos.map((p, i) => (
              <Bullet2 key={i} text={p} />
            ))}
          </Section>
        )}

        {diagnostico.proximosPassos?.length > 0 && (
          <Section title="Próximos passos">
            {diagnostico.proximosPassos.map((p, i) => (
              <Bullet2 key={i} text={p} />
            ))}
          </Section>
        )}

        {/* CTA WhatsApp */}
        <div className="mt-8 rounded-2xl border border-[#EAF1FB] bg-[#F5F8FD] p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#2C6FEA] text-white">
              <MessageCircle className="size-5" />
            </div>
            <div className="min-w-0">
              <p
                className="text-base tracking-tight text-[#0B2A4A]"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
              >
                Receba seu Mapa completo no WhatsApp
              </p>
              <p className="mt-1 text-sm text-[#0B2A4A]/70">
                A Gabriela envia o acesso ao app Mapa do Lipedema — grátis — e o primeiro passo do protocolo.
              </p>
            </div>
          </div>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onWhatsappClick}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2C6FEA] px-5 py-4 text-base font-semibold text-white shadow-lg shadow-[#2C6FEA]/25 transition-transform active:scale-[0.98]"
          >
            <MessageCircle className="size-5" /> Receber meu Mapa no WhatsApp
          </a>

          <p className="mt-2 text-center text-[11px] text-[#0B2A4A]/60">
            Você será redirecionada ao WhatsApp. Sem custo.
          </p>
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-[#0B2A4A]/60">
          Leitura educacional. Não substitui avaliação médica. Gabriela Rosado — CRN 10582.
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#2C6FEA]">
        {title}
      </p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Bullet2({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#EAF1FB] bg-white p-3">
      <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-[#2C6FEA]" />
      <p className="text-[15px] leading-snug text-[#0B2A4A]">{text}</p>
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
      className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-coral px-5 py-4 text-base font-bold text-coral-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
