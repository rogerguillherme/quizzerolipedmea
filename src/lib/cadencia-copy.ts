/**
 * Fonte única das mensagens das duas cadências de WhatsApp (pré-compra e
 * pós-compra / Rotina).
 *
 * Por que isto existe: disparar o MESMO texto, palavra por palavra, para
 * dezenas de números é a assinatura clássica de bot e é o que derruba o
 * número. Cada mensagem tem 3 variantes com o mesmo sentido e palavras
 * diferentes, e a escolha é determinística pelo id do lead
 * (`hashUuid(lead.id) % 3`) — assim a mesma pessoa nunca ouve duas vozes
 * diferentes, e duas leads do mesmo grupo de lipedema recebem textos distintos.
 *
 * Convenções:
 * - `---` em uma linha separa a mensagem em partes; o helper de envio manda
 *   cada bloco como uma mensagem, com 30-60s entre elas.
 * - Tokens `{nome}, `, `{sintoma}`, `{objetivo}`, `{link}` são trocados por
 *   `renderCadencia` (valores vêm de `varsDoLead`).
 * - 💙 aparece no máximo em uma mensagem a cada três, e no meio do texto.
 */

export interface MensagemCadencia {
  /** Identificador estável do passo, ex.: "pos20h". */
  chave: string;
  /** 3 versões com o mesmo conteúdo e outras palavras. */
  variantes: readonly string[];
  /** Quantidade de mensagens em que o texto sai quebrado (derivado de `---`). */
  partes?: number;
  /** Tokens obrigatórios: se algum vier vazio, usa `fallback`. */
  requer?: readonly string[];
  /** Versões sem os tokens de `requer`, para quando o dado não existe. */
  fallback?: readonly string[];
}

/** Hash estável (FNV-1a) de um uuid/string qualquer. Sempre positivo. */
export function hashUuid(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Índice de variante (0-2) determinístico pelo lead. */
export function varianteDoLead(leadId: string, total = 3): number {
  return hashUuid(leadId) % total;
}

/** Deslocamento fixo do lead dentro da janela da manhã: 0-119 minutos. */
export function offsetMinutosDoLead(leadId: string): number {
  return hashUuid(leadId) % 120;
}

/** Troca os tokens `{x}` pelos valores informados. */
export function renderCadencia(
  texto: string,
  vars: Record<string, string | number>,
): string {
  return texto.replace(/\{(\w+)\}/g, (_m, k: string) =>
    vars[k] === undefined ? "" : String(vars[k]),
  );
}

/**
 * Escolhe a variante do lead e já renderiza os tokens.
 * Se algum token de `requer` estiver vazio, cai na variante de fallback —
 * nunca sai frase com `{sintoma}` cru nem com buraco no meio.
 */
export function mensagemPara(
  msg: MensagemCadencia,
  leadId: string,
  vars: Record<string, string | number> = {},
): string {
  const faltando = (msg.requer ?? []).some(
    (k) => !String(vars[k] ?? "").trim(),
  );
  const lista =
    faltando && msg.fallback?.length ? msg.fallback : msg.variantes;
  const i = varianteDoLead(leadId, lista.length);
  const bruto = renderCadencia(lista[i] ?? lista[0]!, vars);
  // Nome vazio deixaria ", deixa eu te perguntar" — limpa a pontuação órfã.
  const limpo = bruto
    .replace(/(^|\n)[ \t]*,[ \t]*/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  // Se a vírgula órfã foi removida do começo, a frase passa a abrir em
  // minúscula ("faz 2 dias..."). Sobe a primeira letra.
  const comeouComToken = /^\s*\{\w+\}\s*,/.test(lista[i] ?? "");
  if (comeouComToken && /^[a-záàâãéêíóôõúç]/.test(limpo)) {
    return limpo.charAt(0).toUpperCase() + limpo.slice(1);
  }
  return limpo;
}


/* ------------------------------------------------------------------ */
/* Personalização a partir das respostas do Mapa                       */
/* ------------------------------------------------------------------ */

/**
 * História real de paciente usada na MSG 4 (+68h).
 *
 * SÓ A GABRIELA PREENCHE. Enquanto estiver vazia, o envio pula a parte da
 * história e manda apenas a pergunta. Não invente paciente, não deixe
 * exemplo aqui: qualquer texto nesta constante vai ao ar no WhatsApp.
 */
export const HISTORIA_PACIENTE = "";

/** Primeiro nome, já limpo. */
export function primeiroNome(nome?: string | null): string {
  return (nome ?? "").trim().split(/\s+/)[0] ?? "";
}

/**
 * Encaixa o sintoma no meio da frase: "você marcou dor ao toque nas pernas".
 * Só baixa a primeira letra se a palavra não for sigla/nome próprio óbvio.
 */
function minuscularInicial(texto: string): string {
  const t = texto.trim();
  if (!t) return "";
  if (t.slice(0, 2).toUpperCase() === t.slice(0, 2)) return t; // "TPM", "SOP"
  return t.charAt(0).toLowerCase() + t.slice(1);
}

/**
 * Monta os tokens de personalização a partir das respostas do Mapa.
 * Campo vazio vira string vazia — e a mensagem que depende dele cai na
 * variante de fallback, nunca sai com `{sintoma}` cru nem com buraco.
 */
export function varsDoLead(lead: {
  nome?: string | null;
  respostas?: Record<string, unknown> | null;
  link?: string;
}): Record<string, string> {
  const r = (lead.respostas ?? {}) as Record<string, unknown>;
  const sintoma = typeof r["sintomaMaior"] === "string" ? r["sintomaMaior"] : "";
  const objetivo = typeof r["objetivo"] === "string" ? r["objetivo"] : "";
  return {
    nome: primeiroNome(lead.nome),
    sintoma: minuscularInicial(sintoma),
    objetivo: minuscularInicial(objetivo),
    link: lead.link ?? "",
  };
}

/* ------------------------------------------------------------------ */
/* Cadência pré-compra                                                 */
/* ------------------------------------------------------------------ */

/**
 * MSG 1 — imediata, no fim da entrega do Mapa.
 * Cita uma resposta específica dela e termina em pergunta fácil.
 */
export const PRE_IMEDIATA: MensagemCadencia = {
  chave: "imediata",
  requer: ["sintoma"],
  fallback: [
    `Uma coisa que eu queria te perguntar: o que te incomoda mais hoje, de manhã ou no fim do dia?`,
  ],
  variantes: [
    `Uma coisa que eu queria te perguntar: você marcou {sintoma}. Isso te incomoda mais de manhã ou no fim do dia?`,
    `Deixa eu te perguntar uma coisa antes: você marcou {sintoma}. Isso já acorda com você ou vai piorando ao longo do dia?`,
    `Me tira uma dúvida sobre o que você respondeu: {sintoma} — é pior quando você levanta ou no fim da tarde?`,
  ],
};

/** MSG 2 — +20h, só para quem não respondeu. */
export const PRE_POS20H: MensagemCadencia = {
  chave: "pos1h_at",
  variantes: [
    `{nome}, deixa eu te perguntar de um jeito mais fácil.

O que mais te atrapalha hoje: 1) a dor ou 2) o inchaço?

Só o número já me ajuda a te orientar melhor.`,
    `{nome}, uma pergunta rápida.

Se desse pra resolver uma coisa primeiro, seria 1) a dor ou 2) o inchaço?

Responde só o número.`,
    `{nome}, me ajuda com uma coisa.

Hoje o que pesa mais: 1) dor ou 2) inchaço?

É só o número — prometo fazer bom uso.`,
  ],
};

/**
 * MSG 3 — +44h. A mensagem que constrói a relação.
 * Sem oferta e sem link, quebrada em 3 partes.
 */
export const PRE_POS44H: MensagemCadencia = {
  chave: "pos2h_foto_at",
  partes: 3,
  variantes: [
    `Quantas vezes já te disseram que era só emagrecer?
---
Eu escuto isso todo dia no consultório. E a parte cruel é que, quando você emagrece, o resto do corpo diminui e a perna fica quase igual. Aí parece que o problema é você.
---
Não é. Lipedema não responde a dieta como gordura comum. Você não falhou — te deram a ferramenta errada.`,
    `{nome}, te falaram quantas vezes que bastava perder peso?
---
Perdi a conta de quantas mulheres chegam aqui depois de ouvir isso de três, quatro médicos diferentes. E de tentarem. E de dar certo no corpo todo, menos nas pernas.
---
Isso não é falta de disciplina sua. Lipedema não responde a restrição como gordura comum — é outro mecanismo, e é por isso que a dieta falhou.`,
    `Posso te falar uma coisa que eu queria ter dito antes pra muita paciente?
---
Quando te dizem que é só emagrecer, e você emagrece, e a perna continua igual, a única conclusão que sobra é que você fez algo errado.
---
Você não fez. Lipedema tem componente inflamatório e não cede a dieta restritiva. O problema nunca foi o seu esforço.`,
  ],
};

/**
 * MSG 4 — +68h. Prova antes de preço, ainda sem link.
 * A história da paciente entra antes desta pergunta só se
 * `HISTORIA_PACIENTE` estiver preenchida.
 */
export const PRE_POS68H: MensagemCadencia = {
  chave: "pos48h_at",
  variantes: [
    `Quer que eu te mostre como funciona a primeira fase?`,
    `Posso te mostrar como começa a primeira fase?`,
    `Se quiser, eu te mostro o que a gente faz na primeira fase. Quer ver?`,
  ],
};

/** MSG 4b — +92h. Primeira vez que aparece link, só pra quem não respondeu nada. */
export const PRE_POS92H: MensagemCadencia = {
  chave: "pos92h_at",
  variantes: [
    `{nome}, como você não me respondeu, vou deixar do jeito mais simples.

O Plano Zero Lipedema é R$67, pagamento único, sem assinatura. São 4 fases, um hábito por vez, começando pelo café da manhã — nada é proibido e nenhuma refeição é pulada. Você fotografa o prato e recebe a leitura na hora.

São 7 dias de garantia: se não fizer sentido, me chama que devolvo.

{link}`,
    `{nome}, vou ser direta porque não quero te encher.

R$67, uma vez só, sem assinatura. Quatro fases, um hábito por vez, começando pelo café. Nada de contar caloria, nada de passar fome. Foto do prato, leitura na hora.

7 dias de garantia, sem burocracia.

{link}`,
    `{nome}, resumindo o que eu faço com as minhas pacientes:

quatro fases, um hábito por vez, sem restrição e sem contagem. O app te acompanha e eu te mando a orientação do dia. R$67, pagamento único, com 7 dias de garantia.

{link}`,
  ],
};

/** MSG 5 — +6 dias. Fechamento. */
export const PRE_POS6D: MensagemCadencia = {
  chave: "pos6d_at",
  variantes: [
    `{nome}, não vou mais te escrever sobre isso.

Seu Mapa continua valendo e eu continuo aqui se um dia você quiser retomar. Se for agora, é por aqui: {link}

E se não for, tá tudo bem de verdade. Você já sabe o nome do que você tem — isso ninguém tira de você.`,
    `{nome}, essa é a última.

Se fizer sentido em algum momento, o caminho é esse: {link}

E se não fizer, sem problema nenhum. O que você descobriu sobre o seu corpo no Mapa continua sendo seu.`,
    `{nome}, prometo parar por aqui.

Quando quiser começar, é só me chamar ou entrar por {link}

Seu Mapa fica guardado. E se for só pra tirar dúvida um dia, também pode me chamar.`,
  ],
};

/* ------------------------------------------------------------------ */
/* Cadência pós-compra (Rotina)                                        */
/* ------------------------------------------------------------------ */

/** D0 + 4h — lembrete de acesso. */
export const ROT_ACESSO_4H: MensagemCadencia = {
  chave: "acesso_4h",
  partes: 2,
  variantes: [
    `{nome}, aqui é a Gabriela.
---
Passei só pra lembrar que seu acesso já está liberado. Abre o app, toca em Rotina na barra de baixo e começa a missão da Fase 1: o café da manhã.

Não precisa mudar tudo hoje. Um hábito de cada vez já é o suficiente pra começar.`,
    `{nome}, é a Gabriela 💙
---
Seu acesso já está no ar. Entra no app, toca em Rotina lá embaixo e começa pela missão da Fase 1, que é o café da manhã.

Não tenta virar sua alimentação inteira hoje. Um hábito por vez resolve.`,
    `{nome}, passando rapidinho, é a Gabriela.
---
Só confirmando que está tudo liberado pra você. No app, a aba Rotina abre a missão da Fase 1: café da manhã.

Comece por aí, sem pressa. Um hábito de cada vez já muda bastante coisa.`,
  ],
};

/** Dica diária da Rotina. O conteúdo vem de `dicas-rotina.ts`. */
export const ROT_DICA: MensagemCadencia = {
  chave: "dica",
  variantes: [
    `Dia {dia} da sua Rotina.

{dica}

Quando cumprir a missão de hoje, marca lá no app na aba Hoje.`,
    `Dia {dia}.

{dica}

Depois de cumprir a missão, é só marcar no app, na aba Hoje 💙`,
    `Dia {dia} por aqui.

{dica}

Cumpriu a missão de hoje? Marca no app, aba Hoje.`,
  ],
};

/** Retomada — 2+ dias sem check-in. */
export const ROT_RETOMADA: MensagemCadencia = {
  chave: "retomada",
  partes: 2,
  variantes: [
    `{nome}, faz {dias} dias sem check-in e eu passei aqui sem cobrança nenhuma.
---
Rotina que funciona é a que aceita falha. Não precisa recomeçar do zero: é só cumprir a missão de hoje e marcar no app, na aba Hoje.

Se algo travou, me conta aqui que a gente ajusta juntas.`,
    `{nome}, vi que faz {dias} dias sem check-in. Não vim cobrar, vim lembrar 💙
---
Falhar faz parte, e você não perdeu nada. É só fazer a missão de hoje e marcar na aba Hoje do app.

Se alguma coisa atrapalhou, me conta que a gente resolve juntas.`,
    `{nome}, são {dias} dias sem marcar check-in, e está tudo bem.
---
Ninguém segura uma rotina em linha reta. Não precisa voltar pro começo: cumpre a missão de hoje e marca no app, na aba Hoje.

Se travou em alguma parte, me escreve aqui.`,
  ],
};

/** Fechamento de semana. */
export const ROT_SEMANA: MensagemCadencia = {
  chave: "semana",
  partes: 2,
  variantes: [
    `{nome}, fim da Fase {semana}.
---
Você passou sete dias ajustando {foco}. Repara no que mudou: inchaço ao acordar, disposição, roupa no fim do dia.

{proximo}`,
    `{nome}, fechamos a Fase {semana} 💙
---
Foram sete dias mexendo em {foco}. Olha pra trás e compara: como está o inchaço de manhã, a energia, a roupa no fim do dia.

{proximo}`,
    `{nome}, Fase {semana} concluída.
---
Sete dias ajustando {foco}. Vale reparar nos sinais: inchaço ao acordar, disposição durante o dia, como a roupa fica à noite.

{proximo}`,
  ],
};

/** Conclusão dos 28 dias + convite do Método Derma. */
export const ROT_CONCLUSAO: MensagemCadencia = {
  chave: "conclusao",
  partes: 2,
  variantes: [
    `{nome}, você chegou ao fim dos 28 dias da Rotina Zero Lipedema.
---
As quatro fases foram concluídas: nada proibido, nenhuma refeição pulada. Só isso já muda muita coisa no inchaço e na dor.

Se você quiser ir além, existe o passo seguinte: o Método Derma, meu acompanhamento de 90 dias com anamnese completa, leitura dos seus exames e prescrição personalizada, por R$297.

Se fizer sentido pra você, responde QUERO SABER aqui que eu te explico direitinho.`,
    `{nome}, fim dos 28 dias da Rotina Zero Lipedema 💙
---
Você fechou as quatro fases sem dieta, sem contagem de caloria e sem pular refeição. Isso sozinho costuma mudar bastante o inchaço e a dor.

Se quiser seguir, o passo seguinte é o Método Derma: 90 dias de acompanhamento comigo, com anamnese completa, leitura dos exames e prescrição personalizada, por R$297.

Se te interessa, responde QUERO SABER que eu explico como funciona.`,
    `{nome}, os 28 dias da Rotina Zero Lipedema terminaram.
---
Você moldou os hábitos das quatro fases sem dieta e sem proibição. Esse é o tipo de mudança que segura o inchaço no longo prazo.

Existe um passo além, se você quiser: o Método Derma, 90 dias de acompanhamento com anamnese, leitura de exames e prescrição feita pra você, por R$297.

Se quiser entender melhor, é só responder QUERO SABER.`,
  ],
};
