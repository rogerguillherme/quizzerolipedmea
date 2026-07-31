import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  MessageCircle,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { submitMapa, type Diagnostico } from "../lib/mapa.functions";
import { criarAcessoMapa } from "../lib/mapa-access.functions";
import { track } from "../lib/analytics";
import estagiosAsset from "@/assets/estagios-lipedema.png.asset.json";

// Paleta editorial (bege/creme + azul profundo + dourado)
const palette = {
  cream: "#F5EFE1",
  creamDark: "#EADECB",
  line: "#D8C6A0",
  ink: "#16324F",
  inkSoft: "#2C5578",
  gold: "#AF7F35",
  goldSoft: "#D9A94B",
} as const;

export const Route = createFileRoute("/mapa")({
  component: () => <MapaPage />,
  head: () => ({
    meta: [
      { title: "Mapa do Lipedema — Teste de 3 minutos com a Dra. Gabriela Rosado" },
      {
        name: "description",
        content:
          "Responda 12 perguntas rápidas e receba a leitura personalizada do seu lipedema, elaborada pela especialista Gabriela Rosado (CRN 10582).",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Answers = {
  nome: string;
  telefone: string;
  tempo: string;
  diagnostico: string;
  sintomaMaior: string;
  dorNivel: string;
  pesoPernas: string;
  dietaExercicio: string;
  sono: string;
  intestino: string;
  atividade: string;
  sinaisNutricionais: string;
  exames: string;
  objetivo: string;
};

type Step =
  | "boas-vindas"
  | "nome"
  | "q1" | "q2" | "q3" | "dorNivel" | "q4" | "q5" | "sono" | "intestino" | "q6" | "sinaisNutricionais" | "q7" | "q8"
  | "contato"
  | "gerando"
  | "resultado"
  | "acesso";

const QUESTION_KEYS = [
  "q1", "q2", "q3", "dorNivel", "q4", "q5", "sono", "intestino", "q6", "sinaisNutricionais", "q7", "q8",
] as const;

const QUESTION_STEPS: Step[] = [...QUESTION_KEYS, "contato"];

const Q = {
  q1: {
    title: "Olhando essas imagens, qual grau mais se parece com as suas pernas hoje?",
    options: ["Estágio 1 — leve", "Estágio 2 — moderado", "Estágio 3 — avançado", "Não sei identificar"],
    icons: ["1️⃣", "2️⃣", "3️⃣", "❓"],
    key: "tempo" as const,
    illustration: {
      src: estagiosAsset.url,
      caption: "Progressão do lipedema, do estágio 1 ao 4. Estágios mais avançados costumam vir acompanhados de nódulos.",
    },
  },


  q2: {
    title: "Você já recebeu diagnóstico de lipedema por um profissional?",
    options: ["Sim, já tenho diagnóstico", "Não, mas desconfio", "Não sabia o que era"],
    icons: ["🩺", "🤔", "💭"],
    key: "diagnostico" as const,
  },
  q3: {
    title: "Qual sintoma mais te incomoda hoje?",
    options: [
      "Dor ao toque nas pernas",
      "Inchaço que piora ao longo do dia",
      "Hematomas (roxos) com facilidade",
      "Dificuldade de emagrecer nas pernas",
    ],
    icons: ["💢", "💧", "🩹", "⚖️"],
    key: "sintomaMaior" as const,
  },
  dorNivel: {
    title: "O quanto isso incomoda ou dói no seu dia a dia?",
    nota: "Dor costuma ser um termômetro da inflamação: quanto mais inflamado o tecido, mais ele tende a doer.",
    options: ["Bem leve", "Moderada", "Forte", "Muito forte, atrapalha o dia"],
    icons: ["🙂", "😕", "😣", "😖"],
    key: "dorNivel" as const,
  },
  q4: {
    title: "Seu peso já variou bastante, mas as pernas quase não mudam?",
    options: ["Sempre, as pernas não acompanham", "Às vezes", "Não emagreço em lugar nenhum", "Não notei isso"],
    icons: ["✅", "🤷‍♀️", "⚖️", "❌"],
    key: "pesoPernas" as const,
  },
  q5: {
    title: "Já tentou dieta e exercício sem ver diferença nas pernas?",
    options: ["Muitas vezes", "Um pouco", "Ainda não tentei"],
    icons: ["🥗", "🏃‍♀️", "🌸"],
    key: "dietaExercicio" as const,
  },
  sono: {
    title: "Como anda seu sono ultimamente?",
    nota: "Sono ruim eleva o cortisol, hormônio do estresse, e estresse alto está bem ligado a mais inflamação no corpo.",
    options: ["Durmo bem, acordo descansada", "Durmo mas acordo cansada", "Sono irregular, durmo pouco", "Tenho insônia frequente"],
    icons: ["😴", "🥱", "🌙", "😵‍💫"],
    key: "sono" as const,
  },
  intestino: {
    title: "Com que frequência você vai ao banheiro?",
    nota: "Intestino preso costuma ser sinal de que o corpo não está eliminando bem, isso pode sobrecarregar todo o processo inflamatório.",
    options: ["Todos os dias", "A cada 2 dias", "Bem irregular", "Fico muito presa"],
    icons: ["✅", "🔄", "⏳", "🚫"],
    key: "intestino" as const,
  },
  q6: {
    title: "Qual seu nível de atividade física hoje?",
    options: ["Sedentária", "Leve", "Moderada", "Intensa"],
    icons: ["🛋️", "🚶‍♀️", "🚴‍♀️", "🏋️‍♀️"],
    key: "atividade" as const,
  },
  sinaisNutricionais: {
    title: "Você tem notado unhas fracas, queda de cabelo ou falta de energia?",
    nota: "Esses sinais costumam aparecer quando faltam nutrientes importantes, vale muito olhar pra eles junto com o lipedema.",
    options: ["Sim, vários desses", "Um ou outro, às vezes", "Não tenho notado"],
    icons: ["💅", "🌿", "😌"],
    key: "sinaisNutricionais" as const,
  },
  q7: {
    title: "Você tem exames recentes (sangue, hormonal)?",
    options: ["Sim, tenho", "Não tenho", "Não sei dizer"],
    icons: ["🧪", "📋", "❓"],
    key: "exames" as const,
  },
  q8: {
    title: "O que você mais gostaria de ter agora?",
    options: [
      "Entender o que está acontecendo comigo",
      "Reduzir dor e inchaço no dia a dia",
      "Ter um plano alimentar personalizado",
      "Acompanhamento contínuo com profissional",
    ],
    icons: ["🧭", "🌊", "🍽️", "🤝"],
    key: "objetivo" as const,
  },
};

type AcessoResult = {
  login: string;
  loginUrl: string;
  whatsappEnviado: boolean;
  whatsappErro: string | null;
};

export function MapaPage({ onClose }: { onClose?: () => void } = {}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("nome");
  const [answers, setAnswers] = useState<Answers>({
    nome: "",
    telefone: "",
    tempo: "",
    diagnostico: "",
    sintomaMaior: "",
    dorNivel: "",
    pesoPernas: "",
    dietaExercicio: "",
    sono: "",
    intestino: "",
    atividade: "",
    sinaisNutricionais: "",
    exames: "",
    objetivo: "",
  });
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [acesso, setAcesso] = useState<AcessoResult | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const submit = useServerFn(submitMapa);
  const gerarAcesso = useServerFn(criarAcessoMapa);

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

  function back() {
    if (step === "nome" || step === "boas-vindas") {
      if (onClose) return onClose();
      return navigate({ to: "/" });
    }
    const flow: Step[] = ["nome", ...QUESTION_STEPS];
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
          respostas: {
            tempo: answers.tempo,
            diagnostico: answers.diagnostico,
            sintomaMaior: answers.sintomaMaior,
            dorNivel: answers.dorNivel,
            pesoPernas: answers.pesoPernas,
            dietaExercicio: answers.dietaExercicio,
            sono: answers.sono,
            intestino: answers.intestino,
            atividade: answers.atividade,
            sinaisNutricionais: answers.sinaisNutricionais,
            exames: answers.exames,
            objetivo: answers.objetivo,
          },
        },
      });
      setDiagnostico(result.diagnostico);
      setLeadId(result.leadId ?? null);
      track("quiz_completed");
      setStep("resultado");
    } catch (e) {
      console.error(e);
      setErro(
        "Não consegui gerar seu Mapa agora. Tente novamente em instantes — se persistir, siga direto para o WhatsApp da Gabriela.",
      );
      setStep("contato");
    }
  }

  async function handleReceberAcesso() {
    if (!leadId) return;
    try {
      const result = await gerarAcesso({ data: { leadId } });
      setAcesso({
        login: result.login,
        loginUrl: result.loginUrl,
        whatsappEnviado: result.whatsappEnviado,
        whatsappErro: result.whatsappErro,
      });
      track("purchase_completed", { step: "acesso_gerado" });
      setStep("acesso");
    } catch (e) {
      console.error(e);
      setErro(
        "Não consegui gerar seu acesso agora. Tente novamente em alguns segundos.",
      );
    }
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: palette.cream,
        color: palette.ink,
        fontFamily: "'Work Sans', sans-serif",
      }}
    >
      <BackgroundArcs />

      {step !== "gerando" && step !== "resultado" && step !== "acesso" && (
        <header
          className="sticky top-0 z-20 backdrop-blur"
          style={{
            background: `${palette.cream}E6`,
            borderBottom: `1px solid ${palette.creamDark}`,
          }}
        >
          <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-3">
            <button
              onClick={back}
              className="grid size-9 place-items-center rounded-full transition-colors"
              style={{ color: palette.ink }}
              aria-label="Voltar"
            >
              <ArrowLeft className="size-5" />
            </button>
            {showProgress ? (
              <>
                <div className="flex-1">
                  <div
                    className="h-[3px] w-full overflow-hidden rounded-full"
                    style={{ background: palette.creamDark }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${palette.gold}, ${palette.goldSoft})`,
                      }}
                    />
                  </div>
                </div>
                <span
                  className="text-[11px] font-semibold tabular-nums tracking-wider"
                  style={{ color: palette.inkSoft }}
                >
                  {String(questionIndex + 1).padStart(2, "0")} / {String(QUESTION_STEPS.length).padStart(2, "0")}
                </span>
              </>
            ) : (
              <p
                className="text-sm italic"
                style={{ fontFamily: "'Fraunces', serif", color: palette.ink }}
              >
                Mapa do Lipedema
              </p>
            )}
          </div>
        </header>
      )}

      <main className="relative z-10 mx-auto max-w-md px-5 pb-24 pt-8">
        {step === "boas-vindas" && (
          <Welcome onStart={() => setStep("nome")} onClose={onClose} />
        )}

        {step === "nome" && (
          <NomeStep
            nome={answers.nome}
            onNext={(nome) => {
              update("nome", nome);
              setStep("q1");
            }}
          />
        )}

        {QUESTION_KEYS.map((k, idx) =>
          step === k ? (
            <ChoiceStep
              key={k}
              index={idx + 1}
              title={Q[k].title}
              options={Q[k].options}
              icons={Q[k].icons}
              nota={"nota" in Q[k] ? (Q[k] as { nota?: string }).nota : undefined}
              illustration={"illustration" in Q[k] ? (Q[k] as { illustration?: { src: string; caption?: string } }).illustration : undefined}
              value={answers[Q[k].key]}
              onChange={(v) => update(Q[k].key, v)}
              onNext={() => {
                const next = QUESTION_STEPS[QUESTION_STEPS.indexOf(k) + 1];
                setStep(next);
              }}
            />
          ) : null,
        )}

        {step === "contato" && (
          <ContatoStep
            nome={answers.nome}
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
            diagnostico={diagnostico}
            onReceberAcesso={handleReceberAcesso}
            erro={erro}
          />
        )}

        {step === "acesso" && acesso && (
          <AcessoStep nome={answers.nome} data={acesso} onClose={onClose} />
        )}
      </main>
    </div>
  );
}

// ---------- Arcos decorativos de fundo ----------
function BackgroundArcs() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.35]"
      preserveAspectRatio="none"
      viewBox="0 0 400 800"
    >
      <defs>
        <linearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.gold} stopOpacity="0.35" />
          <stop offset="100%" stopColor={palette.gold} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[520, 460, 400, 340, 280].map((r) => (
        <circle
          key={r}
          cx="380"
          cy="120"
          r={r}
          fill="none"
          stroke="url(#arc)"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

// ---------- Boas-vindas ----------
function Welcome({
  onStart,
  onClose,
}: {
  onStart: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="pt-4">
      <span
        className="inline-block text-[11px] uppercase tracking-[0.28em]"
        style={{ color: palette.gold }}
      >
        Mapa do Lipedema · CRN 10582
      </span>
      <h1
        className="mt-5 text-[2rem] leading-[1.1] tracking-tight"
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, color: palette.ink }}
      >
        Não é falta de esforço.<br />
        <em style={{ fontStyle: "italic", color: palette.gold }}>É lipedema</em> —
        e agora dá pra entender o seu.
      </h1>
      <p
        className="mt-5 text-[15px] leading-relaxed"
        style={{ color: palette.inkSoft }}
      >
        Um teste de 3 minutos com a Dra. Gabriela Rosado, nutricionista
        especialista em lipedema. Ao final, você recebe seu mapa personalizado
        também no WhatsApp.
      </p>

      <div
        className="mt-8 border-t pt-6"
        style={{ borderColor: palette.creamDark }}
      >
        <ol className="space-y-4">
          {[
            "Você conta como se sente hoje, em 12 perguntas rápidas.",
            "A gente lê seus sintomas com base no protocolo clínico da Gabriela.",
            "Seu mapa fica pronto no fim e vai também para o seu WhatsApp.",
          ].map((t, i) => (
            <li key={i} className="flex gap-4">
              <span
                className="w-6 shrink-0 text-lg italic leading-none pt-1"
                style={{ fontFamily: "'Fraunces', serif", color: palette.gold }}
              >
                {["i", "ii", "iii"][i]}
              </span>
              <span className="text-[14.5px] leading-relaxed" style={{ color: palette.ink }}>
                {t}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <PrimaryButton onClick={onStart}>
        Quero meu mapa <ArrowRight className="size-4" />
      </PrimaryButton>

      <p
        className="mt-4 text-center text-[11px]"
        style={{ color: palette.inkSoft }}
      >
        Leitura educacional. Não substitui avaliação médica.
      </p>

      {onClose ? (
        <button
          onClick={onClose}
          className="mt-3 block w-full text-center text-[11px] underline"
          style={{ color: palette.inkSoft }}
        >
          Fechar
        </button>
      ) : (
        <Link
          to="/"
          className="mt-3 block text-center text-[11px] underline"
          style={{ color: palette.inkSoft }}
        >
          Voltar
        </Link>
      )}
    </div>
  );
}

// ---------- Nome ----------
function NomeStep({
  nome,
  onNext,
}: {
  nome: string;
  onNext: (nome: string) => void;
}) {
  const [n, setN] = useState(nome);
  return (
    <div className="pt-4">
      <span
        className="text-[11px] uppercase tracking-[0.28em]"
        style={{ color: palette.gold }}
      >
        Antes de começar
      </span>
      <h1
        className="mt-4 text-[1.7rem] leading-[1.15] tracking-tight"
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, color: palette.ink }}
      >
        Como você <em style={{ color: palette.gold }}>quer ser chamada</em>?
      </h1>
      <p
        className="mt-2 text-sm"
        style={{ color: palette.inkSoft }}
      >
        Só o primeiro nome já basta é para personalizar seu mapa.
      </p>

      <input
        autoFocus
        value={n}
        onChange={(e) => setN(e.target.value)}
        placeholder="Seu primeiro nome"
        className="mt-6 w-full rounded-none border-0 border-b-2 bg-transparent px-1 py-3 text-lg outline-none transition-colors focus:border-b-2"
        style={{
          borderBottomColor: palette.line,
          color: palette.ink,
          fontFamily: "'Fraunces', serif",
        }}
      />

      <PrimaryButton
        disabled={n.trim().length < 2}
        onClick={() => onNext(n.trim())}
      >
        Continuar <ArrowRight className="size-4" />
      </PrimaryButton>
    </div>
  );
}

// ---------- Pergunta padrão ----------
function ChoiceStep({
  index,
  title,
  nota,
  options,
  icons,
  illustration,
  value,
  onChange,
  onNext,
}: {
  index: number;
  title: string;
  nota?: string;
  options: string[];
  icons?: string[];
  illustration?: { src: string; caption?: string };
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  const roman = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"][index - 1];
  return (
    <div className="pt-2">
      <span
        className="text-[11px] italic uppercase tracking-[0.28em]"
        style={{ fontFamily: "'Fraunces', serif", color: palette.gold }}
      >
        Pergunta {roman}
      </span>
      <h1
        className="mt-3 text-[1.55rem] leading-[1.2] tracking-tight"
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, color: palette.ink }}
      >
        {title}
      </h1>

      {nota && (
        <p className="mt-2 text-[12.5px] italic leading-relaxed" style={{ color: palette.inkSoft }}>
          {nota}
        </p>
      )}

      {illustration && (
        <figure
          className="mt-5 overflow-hidden rounded-2xl border"
          style={{
            borderColor: palette.creamDark,
            background: "#FFFBF2",
            boxShadow: `0 10px 30px -18px ${palette.ink}33`,
          }}
        >
          <img
            src={illustration.src}
            alt={illustration.caption ?? "Ilustração"}
            className="w-full h-auto object-cover"
            loading="eager"
          />
          {illustration.caption && (
            <figcaption
              className="px-4 py-2 text-[11px] italic"
              style={{
                fontFamily: "'Fraunces', serif",
                color: palette.inkSoft,
                borderTop: `1px solid ${palette.creamDark}`,
              }}
            >
              {illustration.caption}
            </figcaption>
          )}
        </figure>
      )}

      <div className="mt-7 space-y-3">
        {options.map((opt, i) => {
          const selected = value === opt;
          const icon = icons?.[i];
          return (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setTimeout(onNext, 220);
              }}
              className="flex w-full items-center gap-3 rounded-2xl border px-5 py-4 text-left text-[15px] transition-all"
              style={{
                borderColor: selected ? palette.gold : palette.creamDark,
                background: selected ? "#FFFBF2" : "#FDFAF1",
                color: palette.ink,
                boxShadow: selected
                  ? `0 6px 24px -12px ${palette.gold}55`
                  : "0 1px 0 rgba(0,0,0,0.02)",
                fontWeight: selected ? 600 : 500,
              }}
            >
              {icon && (
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full text-lg"
                  style={{
                    background: selected ? `${palette.gold}22` : "#FFFFFF",
                    border: `1px solid ${selected ? palette.gold : palette.creamDark}`,
                  }}
                >
                  {icon}
                </span>
              )}
              <span className="flex-1">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Contato ----------
function ContatoStep({
  nome,
  telefone,
  onChange,
  onSubmit,
  erro,
}: {
  nome: string;
  telefone: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  erro: string | null;
}) {
  return (
    <div className="pt-2">
      <span
        className="text-[11px] uppercase tracking-[0.28em]"
        style={{ color: palette.gold }}
      >
        Último passo
      </span>
      <h1
        className="mt-3 text-[1.7rem] leading-[1.15] tracking-tight"
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, color: palette.ink }}
      >
        {nome ? `${nome.split(" ")[0]}, ` : ""}
        para onde eu envio o acesso ao&nbsp;seu <em style={{ color: palette.gold }}>Mapa do Lipedema</em>?
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed" style={{ color: palette.inkSoft }}>
        Envia seu WhatsApp aqui abaixo, assim você recebe o acesso ao mapa e pode revisar com calma todas as dicas e como colocar em prática de forma rápida.
      </p>

      <input
        autoFocus
        inputMode="tel"
        value={telefone}
        onChange={(e) => onChange(e.target.value)}
        placeholder="(11) 9 8888-7777"
        className="mt-6 w-full rounded-none border-0 border-b-2 bg-transparent px-1 py-3 text-lg outline-none"
        style={{
          borderBottomColor: palette.line,
          color: palette.ink,
          fontFamily: "'Fraunces', serif",
        }}
      />

      <p className="mt-3 text-[11px]" style={{ color: palette.inkSoft }}>
        Clique no botão abaixo para confirmar seu número
      </p>

      {erro && (
        <div
          className="mt-4 rounded-xl border p-3 text-sm"
          style={{
            borderColor: `${palette.gold}66`,
            background: "#FFF8EC",
            color: palette.ink,
          }}
        >
          {erro}
        </div>
      )}

      <PrimaryButton
        disabled={telefone.trim().length < 8}
        onClick={onSubmit}
      >
        Gerar meu mapa 🧭
      </PrimaryButton>
    </div>
  );
}

// ---------- Gerando ----------
function Gerando({ nome }: { nome: string }) {
  return (
    <div className="grid min-h-[70vh] place-items-center text-center px-5">
      <div>
        <div
          className="mx-auto grid size-16 place-items-center rounded-full"
          style={{
            background: "#FFFBF2",
            border: `1px solid ${palette.line}`,
            color: palette.gold,
          }}
        >
          <Loader2 className="size-8 animate-spin" />
        </div>
        <p
          className="mt-8 text-2xl tracking-tight"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, color: palette.ink }}
        >
          {nome
            ? `${nome.split(" ")[0]}, estou lendo suas respostas…`
            : "Lendo suas respostas…"}
        </p>
        <p className="mt-3 text-sm" style={{ color: palette.inkSoft }}>
          Montando seu Mapa personalizado. Leva alguns segundos.
        </p>
      </div>
    </div>
  );
}

// ---------- Resultado ----------
function Resultado({
  nome,
  diagnostico,
  onReceberAcesso,
  erro,
}: {
  nome: string;
  diagnostico: Diagnostico;
  onReceberAcesso: () => Promise<void>;
  erro: string | null;
}) {
  const primeiroNome = nome.split(" ")[0];
  const [enviando, setEnviando] = useState(false);

  const estagioLabel =
    diagnostico.estagio === "Indeterminado"
      ? "A definir com avaliação"
      : `Estágio percebido: ${diagnostico.estagio}`;

  async function handle() {
    setEnviando(true);
    try {
      await onReceberAcesso();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col px-1 pt-2 pb-4">
      <span
        className="text-[10px] uppercase tracking-[0.28em]"
        style={{ color: palette.gold }}
      >
        Mapa de {primeiroNome}
      </span>

      <h1
        className="mt-2 text-[1.25rem] leading-[1.2] tracking-tight"
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, color: palette.ink }}
      >
        {diagnostico.aberturaValidadora}
      </h1>

      <div
        className="mt-3 rounded-xl border px-4 py-3"
        style={{ borderColor: palette.creamDark, background: "#FFFBF2" }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] uppercase tracking-[0.24em]"
            style={{ color: palette.gold }}
          >
            Você está aqui
          </span>
          <span
            className="text-[10px] italic"
            style={{ fontFamily: "'Fraunces', serif", color: palette.inkSoft }}
          >
            leitura, não diagnóstico
          </span>
        </div>
        <p
          className="mt-1 text-base tracking-tight"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, color: palette.ink }}
        >
          {estagioLabel}
        </p>
        <StageBar estagio={diagnostico.estagio} />
      </div>

      <div className="mt-3">
        <span
          className="text-[10px] uppercase tracking-[0.28em]"
          style={{ color: palette.gold }}
        >
          Suas 3 prioridades
        </span>
        <ol className="mt-2 space-y-1.5">
          {diagnostico.prioridades.slice(0, 3).map((p, i) => (
            <li key={i} className="flex gap-2.5">
              <span
                className="w-4 shrink-0 text-sm italic leading-none pt-0.5"
                style={{ fontFamily: "'Fraunces', serif", color: palette.gold }}
              >
                {["i", "ii", "iii"][i]}
              </span>
              <p className="text-[13px] leading-snug" style={{ color: palette.ink }}>
                {p}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-auto pt-4">
        <button
          onClick={handle}
          disabled={enviando}
          className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-[15px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-60"
          style={{
            background: `linear-gradient(180deg, ${palette.goldSoft}, ${palette.gold})`,
            color: "#FFFFFF",
            boxShadow: `0 10px 30px -12px ${palette.gold}88, inset 0 1px 0 #FFFFFF66`,
          }}
        >
          {enviando ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Criando seu acesso e enviando no WhatsApp…
            </>
          ) : (
            <>
              <MessageCircle className="size-5" /> Receber acesso no WhatsApp
            </>
          )}
        </button>

        {erro && (
          <p className="mt-2 text-center text-[11px]" style={{ color: "#b91c1c" }}>
            {erro}
          </p>
        )}

        <p
          className="mt-2 text-center text-[10px] leading-tight"
          style={{ color: palette.inkSoft }}
        >
          Ao confirmar, criamos seu acesso e enviamos login e senha no seu WhatsApp em segundos. Leitura educacional — Gabriela Rosado, CRN 10582.
        </p>
      </div>
    </div>
  );
}


// ---------- Acesso ----------
function AcessoStep({
  nome,
  data,
  onClose,
}: {
  nome: string;
  data: AcessoResult;
  onClose?: () => void;
}) {
  const primeiroNome = nome.split(" ")[0];
  return (
    <div className="pt-8">
      <div className="text-center">
        <div
          className="mx-auto grid size-16 place-items-center rounded-full"
          style={{
            background: "#FFFFFF",
            border: `1px solid ${palette.gold}`,
            color: palette.gold,
          }}
        >
          <Sparkles className="size-8" />
        </div>
        <h1
          className="mt-6 text-[1.9rem] leading-[1.15] tracking-tight"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, color: palette.ink }}
        >
          Pronto, <em style={{ color: palette.gold }}>{primeiroNome}</em>.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: palette.inkSoft }}>
          {data.whatsappEnviado
            ? "Enviei seu acesso pelo WhatsApp agora mesmo. Dá uma olhadinha no seu celular 💙"
            : "Seu acesso foi gerado. Anota abaixo, é rapidinho."}
        </p>
      </div>

      <div
        className="mt-8 rounded-2xl border p-6"
        style={{
          borderColor: palette.creamDark,
          background: "#FFFBF2",
        }}
      >
        <div className="flex items-center gap-2">
          <KeyRound className="size-4" style={{ color: palette.gold }} />
          <span
            className="text-[10px] uppercase tracking-[0.28em]"
            style={{ color: palette.gold }}
          >
            Seu acesso
          </span>
        </div>

        <div className="mt-4 space-y-3 text-[15px]">
          <div>
            <p className="text-[11px] uppercase tracking-wider" style={{ color: palette.inkSoft }}>
              Login
            </p>
            <p
              className="mt-1 font-semibold tabular-nums"
              style={{ color: palette.ink, fontFamily: "'Fraunces', serif" }}
            >
              {data.login}
            </p>
          </div>
        </div>

        <a
          href={data.loginUrl}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-[15px] font-semibold transition-transform active:scale-[0.98]"
          style={{
            background: `linear-gradient(180deg, ${palette.inkSoft}, ${palette.ink})`,
            color: "#FFFFFF",
            boxShadow: `0 14px 32px -14px ${palette.ink}AA, inset 0 1px 0 #FFFFFF22`,
          }}
        >
          Entrar e criar minha senha <ArrowRight className="size-4" />
        </a>

        {!data.whatsappEnviado && (
          <p className="mt-3 text-[11px] leading-relaxed text-center" style={{ color: palette.inkSoft }}>
            O envio automático pelo WhatsApp falhou, mas você pode entrar direto pelo botão acima.
          </p>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="mt-6 block w-full text-center text-[12px] underline"
          style={{ color: palette.inkSoft }}
        >
          Fechar
        </button>
      )}
    </div>
  );
}

function StageBar({ estagio }: { estagio: Diagnostico["estagio"] }) {
  const map = { "Inicial": 1, "Intermediário": 2, "Avançado": 3, "Indeterminado": 0 };
  const active = map[estagio];
  const labels = ["Inicial", "Intermediário", "Avançado"] as const;
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2">
        {labels.map((l, i) => {
          const on = active === i + 1;
          const past = active > i + 1;
          return (
            <div key={l} className="flex-1">
              <div
                className="h-[3px] rounded-full transition-all"
                style={{
                  background: on || past ? palette.gold : palette.creamDark,
                }}
              />
              <p
                className="mt-2 text-[10.5px] uppercase tracking-widest"
                style={{
                  color: on ? palette.ink : palette.inkSoft,
                  fontWeight: on ? 700 : 500,
                }}
              >
                {l}
              </p>
            </div>
          );
        })}
      </div>
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
      className="group relative mt-8 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-[15px] font-semibold transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        background: `linear-gradient(180deg, ${palette.inkSoft}, ${palette.ink})`,
        color: "#FFFFFF",
        boxShadow: `0 14px 32px -14px ${palette.ink}AA, inset 0 1px 0 #FFFFFF22`,
      }}
    >
      {children}
    </button>
  );
}
