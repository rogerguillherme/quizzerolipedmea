import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, MessageCircle, X, Loader2, CheckCircle2, Sparkles, KeyRound, ArrowRight } from "lucide-react";
import { submitMapa, type Diagnostico } from "@/lib/mapa.functions";
import { criarAcessoMapa } from "@/lib/mapa-access.functions";
import { track } from "@/lib/analytics";
import draGabrielaAsset from "@/assets/dra-gabriela.png.asset.json";

// Paleta
const C = {
  cream: "#F5EFE1",
  creamSoft: "#FAF5E8",
  bubble: "#FFFFFF",
  bubbleUser: "#16324F",
  ink: "#16324F",
  inkSoft: "#3A5A7A",
  gold: "#AF7F35",
  goldSoft: "#D9A94B",
  line: "#E4D9BE",
} as const;

// ------------- Perguntas (mesmas do quiz, adaptadas ao formato de chat) -------------
type ChoiceQ = {
  key:
    | "tempo" | "diagnostico" | "sintomaMaior" | "pesoPernas"
    | "dietaExercicio" | "atividade" | "exames" | "objetivo";
  gabi: (nome: string) => string;
  options: { label: string; short: string }[];
};

const QS: ChoiceQ[] = [
  {
    key: "tempo",
    gabi: (n) => `${n}, olhando as suas pernas hoje, qual desses estágios mais se parece com elas?`,
    options: [
      { label: "Estágio 1 — leve", short: "Estágio 1" },
      { label: "Estágio 2 — moderado", short: "Estágio 2" },
      { label: "Estágio 3 — avançado", short: "Estágio 3" },
      { label: "Não sei identificar", short: "Não sei" },
    ],
  },
  {
    key: "diagnostico",
    gabi: () => "Você já recebeu diagnóstico de lipedema por algum profissional?",
    options: [
      { label: "Sim, já tenho diagnóstico", short: "Já tenho diagnóstico" },
      { label: "Não, mas desconfio", short: "Desconfio" },
      { label: "Não sabia o que era", short: "Não sabia" },
    ],
  },
  {
    key: "sintomaMaior",
    gabi: () => "E qual sintoma mais te incomoda no dia a dia?",
    options: [
      { label: "Dor ao toque nas pernas", short: "Dor ao toque" },
      { label: "Inchaço que piora ao longo do dia", short: "Inchaço" },
      { label: "Hematomas (roxos) com facilidade", short: "Hematomas" },
      { label: "Dificuldade de emagrecer nas pernas", short: "Não emagrece" },
    ],
  },
  {
    key: "pesoPernas",
    gabi: () => "Seu peso já variou bastante, mas as pernas quase não mudam?",
    options: [
      { label: "Sempre", short: "Sempre" },
      { label: "Às vezes", short: "Às vezes" },
      { label: "Não notei isso", short: "Não notei" },
    ],
  },
  {
    key: "dietaExercicio",
    gabi: () => "Já tentou dieta e exercício sem ver diferença nas pernas?",
    options: [
      { label: "Muitas vezes", short: "Muitas vezes" },
      { label: "Um pouco", short: "Um pouco" },
      { label: "Ainda não tentei", short: "Não tentei" },
    ],
  },
  {
    key: "atividade",
    gabi: () => "Como está seu nível de atividade física hoje?",
    options: [
      { label: "Sedentária", short: "Sedentária" },
      { label: "Leve", short: "Leve" },
      { label: "Moderada", short: "Moderada" },
      { label: "Intensa", short: "Intensa" },
    ],
  },
  {
    key: "exames",
    gabi: () => "Você tem exames recentes (sangue, hormonal)?",
    options: [
      { label: "Sim, tenho", short: "Tenho" },
      { label: "Não tenho", short: "Não tenho" },
      { label: "Não sei dizer", short: "Não sei" },
    ],
  },
  {
    key: "objetivo",
    gabi: () => "Última: o que você mais gostaria de ter agora?",
    options: [
      { label: "Entender o que está acontecendo comigo", short: "Entender" },
      { label: "Reduzir dor e inchaço no dia a dia", short: "Reduzir dor" },
      { label: "Ter um plano alimentar personalizado", short: "Plano alimentar" },
      { label: "Acompanhamento contínuo com profissional", short: "Acompanhamento" },
    ],
  },
];

// ------------- DDD → região (macro) -------------
function regiaoPorDDD(tel: string): { uf: string; regiao: string; comentario: string } | null {
  const digits = tel.replace(/\D/g, "");
  // 13 dígitos = 55 + DDD (2) + celular (9). 10 ou 11 dígitos = DDD + fixo/celular, SEM código do país.
  let ddd = "";
  if (digits.length === 12 || digits.length === 13) ddd = digits.slice(2, 4);
  else if (digits.length === 10 || digits.length === 11) ddd = digits.slice(0, 2);
  if (!ddd) return null;
  const n = Number(ddd);
  const map: Record<number, { uf: string; regiao: string; comentario: string }> = {
    11: { uf: "SP", regiao: "Sudeste", comentario: "São Paulo — atendo muita paciente aí, dá pra adaptar bem o cardápio à correria do dia a dia." },
    12: { uf: "SP", regiao: "Sudeste", comentario: "Vale do Paraíba (SP), ótimo — clima ajuda bastante na circulação." },
    13: { uf: "SP", regiao: "Sudeste", comentario: "Baixada Santista, adoro atender pacientes do litoral." },
    14: { uf: "SP", regiao: "Sudeste", comentario: "Interior de SP, região com boa oferta de alimentos frescos." },
    15: { uf: "SP", regiao: "Sudeste", comentario: "Sorocaba e região, ótima cozinha caseira pra adaptar o protocolo." },
    16: { uf: "SP", regiao: "Sudeste", comentario: "Ribeirão Preto, clima quente pede atenção especial ao inchaço." },
    17: { uf: "SP", regiao: "Sudeste", comentario: "Noroeste paulista, clima seco e quente pesa no inchaço — a gente ajusta." },
    18: { uf: "SP", regiao: "Sudeste", comentario: "Presidente Prudente e região, dá pra montar um plano bem prático aí." },
    19: { uf: "SP", regiao: "Sudeste", comentario: "Campinas, região com boa oferta de tudo que a gente precisa." },
    21: { uf: "RJ", regiao: "Sudeste", comentario: "Rio de Janeiro, calor e umidade fazem diferença — vou considerar isso." },
    22: { uf: "RJ", regiao: "Sudeste", comentario: "Interior do Rio, ótima base de alimentos frescos." },
    24: { uf: "RJ", regiao: "Sudeste", comentario: "Sul Fluminense, clima ameno ajuda bastante." },
    27: { uf: "ES", regiao: "Sudeste", comentario: "Espírito Santo, clima quente pede atenção ao inchaço." },
    28: { uf: "ES", regiao: "Sudeste", comentario: "Sul do ES, dá pra aproveitar bem o que tem por aí." },
    31: { uf: "MG", regiao: "Sudeste", comentario: "Belo Horizonte, cozinha mineira favorece muito o protocolo." },
    32: { uf: "MG", regiao: "Sudeste", comentario: "Zona da Mata mineira, adoro os ingredientes daí." },
    33: { uf: "MG", regiao: "Sudeste", comentario: "Vale do Rio Doce (MG), a gente adapta com o que tem local." },
    34: { uf: "MG", regiao: "Sudeste", comentario: "Triângulo Mineiro, boa base de proteínas e verduras." },
    35: { uf: "MG", regiao: "Sudeste", comentario: "Sul de Minas, clima ameno favorece muito." },
    37: { uf: "MG", regiao: "Sudeste", comentario: "Centro-Oeste mineiro, culinária caseira favorece muito." },
    38: { uf: "MG", regiao: "Sudeste", comentario: "Norte de Minas, clima quente pede atenção especial ao inchaço." },
    41: { uf: "PR", regiao: "Sul", comentario: "Curitiba, o frio do Sul ajuda no inchaço — mas a alimentação típica precisa de ajuste." },
    42: { uf: "PR", regiao: "Sul", comentario: "Paraná (Ponta Grossa), clima frio favorece a circulação." },
    43: { uf: "PR", regiao: "Sul", comentario: "Norte do Paraná, dá pra montar um plano bem local." },
    44: { uf: "PR", regiao: "Sul", comentario: "Maringá (PR), clima quente pede atenção especial." },
    45: { uf: "PR", regiao: "Sul", comentario: "Oeste do Paraná, culinária forte pede ajustes." },
    46: { uf: "PR", regiao: "Sul", comentario: "Sudoeste do Paraná, clima frio ajuda." },
    47: { uf: "SC", regiao: "Sul", comentario: "Santa Catarina — atendo muita paciente aí, tem uns ajustes ótimos pra fazer." },
    48: { uf: "SC", regiao: "Sul", comentario: "Florianópolis e região, dá pra aproveitar peixes e frutos do mar no protocolo." },
    49: { uf: "SC", regiao: "Sul", comentario: "Oeste catarinense, cozinha forte que a gente adapta bem." },
    51: { uf: "RS", regiao: "Sul", comentario: "Porto Alegre, cozinha gaúcha tem ajustes bem interessantes." },
    53: { uf: "RS", regiao: "Sul", comentario: "Sul do RS, frio ajuda no inchaço." },
    54: { uf: "RS", regiao: "Sul", comentario: "Serra gaúcha, clima frio favorece muito." },
    55: { uf: "RS", regiao: "Sul", comentario: "Centro-oeste do RS, dá pra montar um plano bem regional." },
    61: { uf: "DF", regiao: "Centro-Oeste", comentario: "Brasília, clima seco pede atenção à hidratação." },
    62: { uf: "GO", regiao: "Centro-Oeste", comentario: "Goiás, cozinha típica que a gente adapta bem." },
    63: { uf: "TO", regiao: "Norte", comentario: "Tocantins, calor forte — vou considerar isso no plano." },
    64: { uf: "GO", regiao: "Centro-Oeste", comentario: "Interior de Goiás, base de alimentos naturais bem forte." },
    65: { uf: "MT", regiao: "Centro-Oeste", comentario: "Mato Grosso, calor intenso pede atenção especial." },
    66: { uf: "MT", regiao: "Centro-Oeste", comentario: "Interior do MT, dá pra aproveitar bastante coisa local." },
    67: { uf: "MS", regiao: "Centro-Oeste", comentario: "Mato Grosso do Sul, cozinha regional que a gente adapta." },
    68: { uf: "AC", regiao: "Norte", comentario: "Acre, calor e umidade pedem atenção especial ao inchaço." },
    69: { uf: "RO", regiao: "Norte", comentario: "Rondônia, clima quente vou considerar no seu plano." },
    71: { uf: "BA", regiao: "Nordeste", comentario: "Salvador, cozinha baiana tem muita opção que combina com o protocolo." },
    73: { uf: "BA", regiao: "Nordeste", comentario: "Sul da Bahia, adoro os ingredientes daí." },
    74: { uf: "BA", regiao: "Nordeste", comentario: "Norte da Bahia, calor pede atenção especial." },
    75: { uf: "BA", regiao: "Nordeste", comentario: "Feira de Santana e região, dá pra aproveitar muita coisa local." },
    77: { uf: "BA", regiao: "Nordeste", comentario: "Oeste baiano, base de alimentos naturais bem forte." },
    79: { uf: "SE", regiao: "Nordeste", comentario: "Sergipe, cozinha rica que a gente adapta bem." },
    81: { uf: "PE", regiao: "Nordeste", comentario: "Recife, calor forte — vamos ficar atentas ao inchaço." },
    82: { uf: "AL", regiao: "Nordeste", comentario: "Alagoas, cozinha regional que combina bem." },
    83: { uf: "PB", regiao: "Nordeste", comentario: "Paraíba, calor pede atenção à hidratação." },
    84: { uf: "RN", regiao: "Nordeste", comentario: "Rio Grande do Norte, dá pra aproveitar peixes no protocolo." },
    85: { uf: "CE", regiao: "Nordeste", comentario: "Fortaleza, adoro atender pacientes daí — vou considerar o clima." },
    86: { uf: "PI", regiao: "Nordeste", comentario: "Piauí, calor forte — atenção especial ao inchaço." },
    87: { uf: "PE", regiao: "Nordeste", comentario: "Sertão pernambucano, cozinha típica que a gente adapta." },
    88: { uf: "CE", regiao: "Nordeste", comentario: "Interior do Ceará, dá pra montar plano bem regional." },
    89: { uf: "PI", regiao: "Nordeste", comentario: "Sul do Piauí, calor intenso pede atenção." },
    91: { uf: "PA", regiao: "Norte", comentario: "Pará, calor e umidade pedem atenção especial ao inchaço." },
    92: { uf: "AM", regiao: "Norte", comentario: "Amazonas, clima quente e úmido — vou considerar no seu plano." },
    93: { uf: "PA", regiao: "Norte", comentario: "Oeste do Pará, dá pra aproveitar peixes e frutas locais." },
    94: { uf: "PA", regiao: "Norte", comentario: "Sudeste do Pará, cozinha forte que a gente adapta." },
    95: { uf: "RR", regiao: "Norte", comentario: "Roraima, calor forte pede atenção especial." },
    96: { uf: "AP", regiao: "Norte", comentario: "Amapá, clima quente e úmido — atenção ao inchaço." },
    97: { uf: "AM", regiao: "Norte", comentario: "Interior do Amazonas, dá pra aproveitar muita coisa local." },
    98: { uf: "MA", regiao: "Nordeste", comentario: "Maranhão (São Luís), cozinha regional que a gente adapta." },
    99: { uf: "MA", regiao: "Nordeste", comentario: "Interior do Maranhão, calor pede atenção especial." },
  };
  return map[n] || null;
}

// ------------- Mensagens -------------
type Msg =
  | { id: string; from: "gabi"; text: string }
  | { id: string; from: "user"; text: string }
  | { id: string; from: "system"; kind: "report"; diagnostico: Diagnostico; nome: string }
  | { id: string; from: "system"; kind: "acesso"; login: string; senha: string; loginUrl: string; whatsappEnviado: boolean };

type Stage =
  | { kind: "asking-nome" }
  | { kind: "asking-telefone" }
  | { kind: "asking-choice"; qIndex: number }
  | { kind: "submitting" }
  | { kind: "showing-report" }
  | { kind: "sending-access" }
  | { kind: "done" };

// ------------- Componente principal -------------
export function MapaChat({ onClose }: { onClose?: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [stage, setStage] = useState<Stage>({ kind: "asking-nome" });
  const [typing, setTyping] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [inputText, setInputText] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = useServerFn(submitMapa);
  const gerarAcesso = useServerFn(criarAcessoMapa);

  // Track quiz start
  useEffect(() => {
    track("quiz_started");
  }, []);

  // Auto-scroll
  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 60);
    return () => clearTimeout(t);
  }, [msgs, typing]);

  // Foco no input
  useEffect(() => {
    if (stage.kind === "asking-nome" || stage.kind === "asking-telefone") {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [stage.kind]);

  // Mensagens iniciais (guardadas contra StrictMode double-invoke)
  const bootedRef = useRef(false);
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    (async () => {
      await gabiSay("Oi! Aqui é a Gabriela Rosado, nutricionista (CRN 10582).");
      await gabiSay("Vou te fazer algumas perguntas rápidas pra montar o seu Mapa do Lipedema — leva uns 2 minutinhos. Pode ser?");
      await gabiSay("Antes de tudo — como você quer ser chamada?");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pushMsg(m: Msg) {
    setMsgs((prev) => [...prev, m]);
  }

  function pushGabi(text: string) {
    pushMsg({ id: crypto.randomUUID(), from: "gabi", text });
  }
  function pushUser(text: string) {
    pushMsg({ id: crypto.randomUUID(), from: "user", text });
  }

  // Simula "digitando" proporcional ao tamanho da mensagem — mais humano.
  async function gabiSay(text: string, delay?: number) {
    // ~35ms por caractere, mínimo 900ms, máximo 3200ms
    const auto = Math.min(3200, Math.max(900, Math.round(text.length * 35)));
    const wait = delay ?? auto;
    // pequena pausa antes de "começar a digitar"
    await new Promise((r) => setTimeout(r, 350));
    setTyping(true);
    await new Promise((r) => setTimeout(r, wait));
    setTyping(false);
    pushGabi(text);
  }

  async function handleSendNome() {
    const val = inputText.trim();
    if (val.length < 2) return;
    const primeiroNome = val.split(" ")[0];
    setNome(primeiroNome);
    setInputText("");
    pushUser(val);
    setStage({ kind: "asking-telefone" });
    await gabiSay(`Prazer, ${primeiroNome} 💙`);
    await gabiSay(`Me passa seu WhatsApp com DDD? É por ali que eu vou te mandar o acesso ao seu Mapa depois.`);
  }

  async function handleSendTelefone() {
    const val = inputText.trim();
    const digits = val.replace(/\D/g, "");
    if (digits.length < 10) {
      setErro("Preciso de um número válido com DDD, tipo (11) 9 8888-7777.");
      return;
    }
    setErro(null);
    setTelefone(val);
    setInputText("");
    pushUser(val);
    const info = regiaoPorDDD(val);
    if (info) {
      await gabiSay(`Ah, ${info.comentario}`);
    } else {
      await gabiSay("Anotado 📍");
    }
    setStage({ kind: "asking-choice", qIndex: 0 });
    await gabiSay(QS[0].gabi(nome));
  }

  async function handleChoice(qIndex: number, opt: { label: string; short: string }) {
    const q = QS[qIndex];
    pushUser(opt.short);
    setAnswers((prev) => ({ ...prev, [q.key]: opt.label }));

    // Comentário reativo curto (opcional)
    const reacao = reacaoParaResposta(q.key, opt.label, nome);
    if (reacao) await gabiSay(reacao, 550);

    const next = qIndex + 1;
    if (next < QS.length) {
      setStage({ kind: "asking-choice", qIndex: next });
      await gabiSay(QS[next].gabi(nome));
    } else {
      // Todas respondidas — submeter
      setStage({ kind: "submitting" });
      await gabiSay(`Perfeito, ${nome}. Vou juntar tudo aqui e montar seu Mapa…`, 600);
      await enviarQuiz();
    }
  }

  async function enviarQuiz() {
    setErro(null);
    try {
      const result = await submit({
        data: {
          nome,
          telefone,
          respostas: {
            tempo: answers.tempo || "",
            diagnostico: answers.diagnostico || "",
            sintomaMaior: answers.sintomaMaior || "",
            pesoPernas: answers.pesoPernas || "",
            dietaExercicio: answers.dietaExercicio || "",
            atividade: answers.atividade || "",
            exames: answers.exames || "",
            objetivo: answers.objetivo || "",
          },
        },
      });
      setDiagnostico(result.diagnostico);
      setLeadId(result.leadId ?? null);
      track("quiz_completed");
      setTyping(false);
      pushMsg({
        id: crypto.randomUUID(),
        from: "system",
        kind: "report",
        diagnostico: result.diagnostico,
        nome,
      });
      await gabiSay("Esse é o resumo do que li nas suas respostas. 💙", 900);
      await gabiSay("Posso te chamar agora no WhatsApp com o acesso completo ao seu Mapa?");
      setStage({ kind: "showing-report" });
    } catch (e) {
      console.error(e);
      setTyping(false);
      setErro("Tive um problema pra gerar seu Mapa agora. Vamos tentar de novo?");
      setStage({ kind: "showing-report" });
    }
  }

  async function handleReceberAcesso() {
    if (!leadId) return;
    setStage({ kind: "sending-access" });
    pushUser("Sim, pode chamar 💙");
    await gabiSay("Estou criando seu acesso e enviando agora…", 500);
    try {
      const result = await gerarAcesso({ data: { leadId } });
      track("purchase_completed", { step: "acesso_gerado" });
      setTyping(false);
      pushMsg({
        id: crypto.randomUUID(),
        from: "system",
        kind: "acesso",
        login: result.login,
        senha: result.senha,
        loginUrl: result.loginUrl,
        whatsappEnviado: result.whatsappEnviado,
      });
      if (result.whatsappEnviado) {
        await gabiSay("Prontinho! Já mandei no seu WhatsApp. Dá uma olhadinha 📲");
      } else {
        await gabiSay("Seu acesso está pronto — anote aí, é rapidinho.");
      }
      setStage({ kind: "done" });
    } catch (e) {
      console.error(e);
      setTyping(false);
      setErro("Não consegui gerar seu acesso agora. Tenta de novo em alguns segundos?");
      setStage({ kind: "showing-report" });
    }
  }

  // ---- Render ----
  return (
    <div className="flex h-[100dvh] flex-col" style={{ background: C.cream }}>
      {/* Header */}
      <header
        className="flex items-center gap-3 border-b px-4 py-3"
        style={{ borderColor: C.line, background: C.creamSoft }}
      >
        <div className="relative">
          <img
            src={draGabrielaAsset.url}
            alt="Dra. Gabriela Rosado"
            className="size-11 rounded-full object-cover"
            style={{ border: `2px solid ${C.gold}` }}
          />
          <span
            className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full"
            style={{ background: "#22C55E", border: "2px solid #F5EFE1" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[15px] leading-tight"
            style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 500 }}
          >
            Dra. Gabriela Rosado
          </p>
          <p className="text-[11px]" style={{ color: C.inkSoft }}>
            Nutricionista · CRN 10582 · online
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full transition"
            style={{ color: C.ink }}
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        )}
      </header>

      {/* Chat scroll */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {msgs.map((m) => {
          if (m.from === "gabi") return <GabiBubble key={m.id} text={m.text} />;
          if (m.from === "user") return <UserBubble key={m.id} text={m.text} />;
          if (m.kind === "report") return <ReportCard key={m.id} nome={m.nome} diagnostico={m.diagnostico} />;
          if (m.kind === "acesso")
            return (
              <AcessoCard
                key={m.id}
                login={m.login}
                senha={m.senha}
                loginUrl={m.loginUrl}
                whatsappEnviado={m.whatsappEnviado}
              />
            );
          return null;
        })}
        {typing && <TypingBubble />}
      </div>

      {/* Composer */}
      <div className="border-t px-3 py-3" style={{ borderColor: C.line, background: C.creamSoft }}>
        {erro && (
          <p className="mb-2 text-center text-[12px]" style={{ color: "#B91C1C" }}>
            {erro}
          </p>
        )}

        {stage.kind === "asking-nome" && (
          <TextComposer
            inputRef={inputRef}
            value={inputText}
            onChange={setInputText}
            onSend={handleSendNome}
            placeholder="Seu primeiro nome"
            disabled={typing}
          />
        )}

        {stage.kind === "asking-telefone" && (
          <TextComposer
            inputRef={inputRef}
            value={inputText}
            onChange={setInputText}
            onSend={handleSendTelefone}
            placeholder="(11) 9 8888-7777"
            inputMode="tel"
            disabled={typing}
          />
        )}

        {stage.kind === "asking-choice" && (
          <ChoiceComposer
            disabled={typing}
            options={QS[stage.qIndex].options}
            onChoose={(opt) => handleChoice(stage.qIndex, opt)}
          />
        )}

        {stage.kind === "submitting" && (
          <div className="flex items-center justify-center gap-2 py-3 text-[13px]" style={{ color: C.inkSoft }}>
            <Loader2 className="size-4 animate-spin" style={{ color: C.gold }} />
            Montando seu Mapa…
          </div>
        )}

        {stage.kind === "showing-report" && diagnostico && (
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={handleReceberAcesso}
              className="flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[14px] font-semibold transition active:scale-[0.98]"
              style={{
                background: `linear-gradient(180deg, ${C.goldSoft}, ${C.gold})`,
                color: "#FFFFFF",
                boxShadow: `0 10px 24px -12px ${C.gold}88`,
              }}
            >
              <MessageCircle className="size-4" /> Sim, pode me chamar no WhatsApp
            </button>
            <button
              onClick={onClose}
              className="rounded-full px-4 py-2 text-[12px]"
              style={{ color: C.inkSoft }}
            >
              Agora não
            </button>
          </div>
        )}

        {stage.kind === "sending-access" && (
          <div className="flex items-center justify-center gap-2 py-3 text-[13px]" style={{ color: C.inkSoft }}>
            <Loader2 className="size-4 animate-spin" style={{ color: C.gold }} />
            Enviando no seu WhatsApp…
          </div>
        )}

        {stage.kind === "done" && (
          <button
            onClick={onClose}
            className="w-full rounded-full px-4 py-3 text-[13px] font-semibold"
            style={{
              background: `linear-gradient(180deg, ${C.inkSoft}, ${C.ink})`,
              color: "#FFF",
            }}
          >
            Fechar conversa
          </button>
        )}
      </div>
    </div>
  );
}

// ------------- Reações curtas -------------
function reacaoParaResposta(key: string, resposta: string, nome: string): string | null {
  const n = nome || "você";
  if (key === "tempo" && resposta.startsWith("Estágio 3"))
    return `Entendi, ${n}. Estágio mais avançado pede um cuidado bem específico — vou considerar isso.`;
  if (key === "tempo" && resposta === "Não sei identificar")
    return "Tudo bem, é super comum não saber identificar. A gente segue com as outras perguntas.";
  if (key === "diagnostico" && resposta.startsWith("Sim"))
    return "Ótimo que já tem o diagnóstico — isso acelera muito nosso plano.";
  if (key === "sintomaMaior" && resposta.startsWith("Dor"))
    return "A dor ao toque é um sinal muito característico. Anotei.";
  if (key === "sintomaMaior" && resposta.startsWith("Inchaço"))
    return "Inchaço que piora ao longo do dia é um marcador clássico. Anotei.";
  if (key === "pesoPernas" && resposta === "Sempre")
    return "Esse padrão é bem típico — não é você, é o lipedema.";
  if (key === "dietaExercicio" && resposta === "Muitas vezes")
    return `${n}, isso não é falta de esforço seu. Prometo.`;
  return null;
}

// ------------- Sub-componentes visuais -------------
function GabiBubble({ text }: { text: string }) {
  return (
    <div className="flex items-end gap-2">
      <img
        src={draGabrielaAsset.url}
        alt=""
        aria-hidden
        className="size-7 shrink-0 rounded-full object-cover"
        style={{ border: `1.5px solid ${C.line}` }}
      />
      <div
        className="max-w-[78%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[14px] leading-snug"
        style={{
          background: C.bubble,
          color: C.ink,
          border: `1px solid ${C.line}`,
          boxShadow: "0 1px 2px rgba(22,50,79,0.04)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[78%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[14px] leading-snug"
        style={{ background: C.bubbleUser, color: "#F5EFE1" }}
      >
        {text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2">
      <img
        src={draGabrielaAsset.url}
        alt=""
        aria-hidden
        className="size-7 shrink-0 rounded-full object-cover"
        style={{ border: `1.5px solid ${C.line}` }}
      />
      <div
        className="rounded-2xl rounded-bl-md px-4 py-3"
        style={{ background: C.bubble, border: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-1">
          <span className="typing-dot" />
          <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
          <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
        </div>
      </div>
      <style>{`
        .typing-dot {
          width: 6px; height: 6px; border-radius: 999px;
          background: ${C.gold}; opacity: 0.6;
          animation: typing-bounce 1s infinite ease-in-out;
          display: inline-block;
        }
        @keyframes typing-bounce {
          0%,80%,100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function TextComposer({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  inputMode,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled?: boolean;
  inputMode?: "text" | "tel";
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) onSend();
      }}
      className="flex items-center gap-2"
    >
      <input
        ref={inputRef}
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 rounded-full border px-4 py-3 text-[14px] outline-none"
        style={{
          borderColor: C.line,
          background: "#FFFFFF",
          color: C.ink,
        }}
      />
      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        className="grid size-11 place-items-center rounded-full transition active:scale-95 disabled:opacity-40"
        style={{
          background: `linear-gradient(180deg, ${C.goldSoft}, ${C.gold})`,
          color: "#FFF",
          boxShadow: `0 6px 16px -8px ${C.gold}88`,
        }}
        aria-label="Enviar"
      >
        <Send className="size-4" />
      </button>
    </form>
  );
}

function ChoiceComposer({
  options,
  onChoose,
  disabled,
}: {
  options: { label: string; short: string }[];
  onChoose: (opt: { label: string; short: string }) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {options.map((opt) => (
        <button
          key={opt.short}
          disabled={disabled}
          onClick={() => onChoose(opt)}
          className="rounded-full border px-3.5 py-2 text-[13px] font-medium transition active:scale-95 disabled:opacity-40"
          style={{
            borderColor: C.gold,
            background: "#FFFBF2",
            color: C.ink,
          }}
        >
          {opt.short}
        </button>
      ))}
    </div>
  );
}

function ReportCard({ nome, diagnostico }: { nome: string; diagnostico: Diagnostico }) {
  const estagioLabel =
    diagnostico.estagio === "Indeterminado"
      ? "A definir com avaliação"
      : `Estágio percebido: ${diagnostico.estagio}`;
  return (
    <div className="flex items-end gap-2">
      <img
        src={draGabrielaAsset.url}
        alt=""
        aria-hidden
        className="size-7 shrink-0 rounded-full object-cover"
        style={{ border: `1.5px solid ${C.line}` }}
      />
      <div
        className="max-w-[85%] rounded-2xl rounded-bl-md p-4"
        style={{
          background: "#FFFBF2",
          border: `1px solid ${C.gold}66`,
          boxShadow: "0 2px 8px rgba(22,50,79,0.06)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5" style={{ color: C.gold }} />
          <span className="text-[10px] uppercase tracking-widest" style={{ color: C.gold }}>
            Mapa de {nome}
          </span>
        </div>
        <p
          className="mt-2 text-[14px] leading-snug"
          style={{ fontFamily: "'Fraunces', serif", color: C.ink }}
        >
          {diagnostico.aberturaValidadora}
        </p>
        <p className="mt-2 text-[12px] font-semibold" style={{ color: C.ink }}>
          {estagioLabel}
        </p>

        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: C.gold }}>
            Suas 3 prioridades
          </p>
          <ol className="mt-1.5 space-y-1">
            {diagnostico.prioridades.slice(0, 3).map((p, i) => (
              <li key={i} className="flex gap-1.5 text-[12.5px] leading-snug" style={{ color: C.ink }}>
                <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" style={{ color: C.gold }} />
                <span>{p}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function AcessoCard({
  login,
  senha,
  loginUrl,
  whatsappEnviado,
}: {
  login: string;
  senha: string;
  loginUrl: string;
  whatsappEnviado: boolean;
}) {
  return (
    <div className="flex items-end gap-2">
      <img
        src={draGabrielaAsset.url}
        alt=""
        aria-hidden
        className="size-7 shrink-0 rounded-full object-cover"
        style={{ border: `1.5px solid ${C.line}` }}
      />
      <div
        className="max-w-[85%] rounded-2xl rounded-bl-md p-4"
        style={{ background: "#FFFFFF", border: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-1.5">
          <KeyRound className="size-3.5" style={{ color: C.gold }} />
          <span className="text-[10px] uppercase tracking-widest" style={{ color: C.gold }}>
            Seu acesso
          </span>
        </div>
        <div className="mt-2 space-y-1.5 text-[13px]" style={{ color: C.ink }}>
          <p>
            <span className="text-[11px] uppercase tracking-wider" style={{ color: C.inkSoft }}>Login</span>
            <br />
            <span className="font-semibold tabular-nums">{login}</span>
          </p>
          <p>
            <span className="text-[11px] uppercase tracking-wider" style={{ color: C.inkSoft }}>Senha</span>
            <br />
            <span className="font-semibold tabular-nums">{senha}</span>
          </p>
        </div>
        <a
          href={loginUrl}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold"
          style={{
            background: `linear-gradient(180deg, ${C.inkSoft}, ${C.ink})`,
            color: "#FFF",
          }}
        >
          Entrar no meu app <ArrowRight className="size-3.5" />
        </a>
        {!whatsappEnviado && (
          <p className="mt-2 text-[11px]" style={{ color: C.inkSoft }}>
            (Envio automático falhou — pode entrar direto acima.)
          </p>
        )}
      </div>
    </div>
  );
}
