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
 * - Tokens `{nome}`, `{oi}`, `{link}`, etc. são trocados por `renderCadencia`.
 * - 💙 aparece no máximo em uma mensagem a cada três, e no meio do texto.
 */

export interface MensagemCadencia {
  /** Identificador estável do passo, ex.: "pos20h". */
  chave: string;
  /** 3 versões com o mesmo conteúdo e outras palavras. */
  variantes: readonly string[];
  /** Quantidade de mensagens em que o texto sai quebrado (derivado de `---`). */
  partes?: number;
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

/** Escolhe a variante do lead e já renderiza os tokens. */
export function mensagemPara(
  msg: MensagemCadencia,
  leadId: string,
  vars: Record<string, string | number> = {},
): string {
  const i = varianteDoLead(leadId, msg.variantes.length);
  return renderCadencia(msg.variantes[i] ?? msg.variantes[0]!, vars).trim();
}

/* ------------------------------------------------------------------ */
/* Cadência pré-compra                                                 */
/* ------------------------------------------------------------------ */

/** +20h — convite pro teste grátis de foto. Primeira mensagem da régua. */
export const PRE_POS20H: MensagemCadencia = {
  chave: "pos1h_at",
  partes: 2,
  variantes: [
    `{oi}! Aqui é a Gabriela.
---
Tem uma coisa bem legal que você ainda não testou: me manda aqui mesmo, respondendo esta mensagem, uma foto de qualquer refeição sua que eu te dou um feedback na hora, se aquele prato ajuda ou atrapalha o seu quadro.

É grátis, são 3 fotos de teste, sem compromisso. É só mandar a foto por aqui.`,
    `{oi}, é a Gabriela falando 💙
---
Queria te mostrar uma coisa que quase ninguém usa: você pode tirar foto de qualquer refeição sua e mandar aqui nesta conversa.

Eu leio o prato e te digo se ele está a favor ou contra o seu lipedema. São 3 fotos por conta da casa, sem compromisso nenhum.`,
    `{oi}, Gabriela por aqui.
---
Uma dica rápida: da próxima vez que você sentar pra comer, fotografa o prato e manda nesta conversa.

Eu respondo dizendo o que naquele prato ajuda e o que atrapalha o inchaço. As 3 primeiras são gratuitas, é só mandar.`,
  ],
};

/** +44h — quebra de objeção ("já tentei de tudo"). */
export const PRE_POS44H: MensagemCadencia = {
  chave: "pos2h_foto_at",
  partes: 2,
  variantes: [
    `{nome}A frase que eu mais escuto é: "eu já tentei de tudo e nada funciona". Faz sentido, porque quase tudo que te ofereceram foi dieta restritiva, e lipedema não responde a restrição, responde a inflamação.
---
Por isso a Rotina Zero Lipedema muda uma refeição por semana, não a sua vida inteira de uma vez. Semana 1 é só o café da manhã. Leva alguns minutos por dia e você não precisa contar caloria nem passar fome.

Se ficou alguma dúvida, me pergunta aqui que eu respondo.`,
    `{nome}Quase toda mulher que chega até mim diz a mesma coisa: já tentou tudo e nada resolveu. E é verdade, porque o que ofereceram foi corte de comida, e lipedema não é problema de excesso, é de inflamação.
---
A Rotina Zero Lipedema vai por outro caminho: ajusta uma refeição por semana. A primeira semana é só o café da manhã, nada além disso. Sem caloria contada e sem fome.

Qualquer dúvida é só perguntar aqui.`,
    `{nome}Se você já tentou dieta, treino, drenagem e nada segurou o inchaço, o problema não foi você. Restrição não trata lipedema, trata peso — e inflamação é outra história.
---
O que funciona é mudança pequena e contínua. Na Rotina a gente mexe em uma refeição por semana, começando pelo café. Sem passar fome e sem planilha de caloria.

Me pergunta o que quiser por aqui.`,
  ],
};

/** +68h — pitch do Plano Premium (R$67). */
export const PRE_POS68H: MensagemCadencia = {
  chave: "pos48h_at",
  partes: 3,
  variantes: [
    `{nome}Voltando pra te fazer um convite direto: hoje eu libero seu acesso ao Plano Premium Zero Lipedema por um valor de inauguração, de R$119 por apenas R$67, sem assinatura obrigatória.
---
O centro do plano é a Rotina Zero Lipedema: a gente ajusta uma refeição por semana, começando pelo café da manhã, sem contar caloria e sem passar fome. E você pode fotografar seu prato pra receber a leitura na hora, o que ajuda, o que atrapalha e o que ajustar na próxima refeição.
---
Tem 7 dias de garantia: se não fizer sentido pra você, é só me chamar que devolvo, sem burocracia. E como bônus, libero todos os meus guias e receitas práticas.

Pra ativar: {link}`,
    `{nome}Vim te fazer um convite bem direto. O acesso ao Plano Premium Zero Lipedema, que é R$119, está saindo por R$67 nesta inauguração. Pagamento único, sem assinatura.
---
Dentro dele está a Rotina Zero Lipedema, que muda uma refeição por semana começando pelo café da manhã 💙 Nada de contar caloria nem de passar fome. E tem a leitura das suas fotos de refeição, com o que ajuda, o que atrapalha e o que trocar depois.
---
São 7 dias de garantia: não gostou, me chama que eu devolvo sem enrolação. Os guias e as receitas práticas vão junto como bônus.

Link pra ativar: {link}`,
    `{nome}Deixa eu ser objetiva: o Plano Premium Zero Lipedema está por R$67 em vez de R$119, pagamento único, sem mensalidade.
---
O coração dele é a Rotina: uma refeição ajustada por semana, a primeira sendo o café da manhã. Você também manda foto do prato e recebe a leitura na hora, dizendo o que ajuda, o que atrapalha e o que mudar na próxima.
---
Se em 7 dias você achar que não é pra você, eu devolvo o valor, é só me avisar. Todos os guias e receitas entram como bônus.

Aqui está o link: {link}`,
  ],
};

/** +6 dias — última chamada. */
export const PRE_POS6D: MensagemCadencia = {
  chave: "pos6d_at",
  partes: 2,
  variantes: [
    `{nome}Essa é a minha última mensagem sobre isso, prometo. O acesso ao Plano Premium Zero Lipedema segue por R$67, sem assinatura, com 7 dias de garantia.
---
Se agora não é a hora, tudo bem. Seu Mapa continua valendo e eu sigo por aqui quando você quiser retomar.

{link}`,
    `{nome}Prometo que é a última vez que eu toco no assunto. O Plano Premium Zero Lipedema continua por R$67, pagamento único, com 7 dias de garantia.
---
Se não for o momento, sem problema nenhum 💙 Seu Mapa não expira e eu fico por aqui pra quando você quiser voltar.

{link}`,
    `{nome}Última mensagem sobre isso, combinado? O Plano Premium Zero Lipedema segue disponível por R$67, sem assinatura e com garantia de 7 dias.
---
Se hoje não dá, tudo certo. O seu Mapa continua guardado e eu sigo aqui quando fizer sentido pra você.

{link}`,
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
    `{nome}aqui é a Gabriela.
---
Passei só pra lembrar que seu acesso já está liberado. Abre o app, toca em Rotina na barra de baixo e começa a missão da Semana 1: o café da manhã.

Não precisa mudar tudo hoje. Uma refeição de cada vez já é o suficiente pra começar.`,
    `{nome}é a Gabriela 💙
---
Seu acesso já está no ar. Entra no app, toca em Rotina lá embaixo e começa pela missão da Semana 1, que é o café da manhã.

Não tenta virar sua alimentação inteira hoje. Uma refeição por vez resolve.`,
    `{nome}passando rapidinho, é a Gabriela.
---
Só confirmando que está tudo liberado pra você. No app, a aba Rotina abre a missão da Semana 1: café da manhã.

Comece por aí, sem pressa. Uma refeição de cada vez já muda bastante coisa.`,
  ],
};

/** Dica diária da Rotina. O conteúdo vem de `dicas-rotina.ts`. */
export const ROT_DICA: MensagemCadencia = {
  chave: "dica",
  variantes: [
    `{nome}dia {dia} da sua Rotina.

{dica}

Quando cumprir a missão de hoje, marca lá no app na aba Hoje.`,
    `{nome}chegamos no dia {dia}.

{dica}

Depois de cumprir a missão, é só marcar no app, na aba Hoje 💙`,
    `{nome}dia {dia} por aqui.

{dica}

Cumpriu a missão de hoje? Marca no app, aba Hoje.`,
  ],
};

/** Retomada — 2+ dias sem check-in. */
export const ROT_RETOMADA: MensagemCadencia = {
  chave: "retomada",
  partes: 2,
  variantes: [
    `{nome}faz {dias} dias sem check-in e eu passei aqui sem cobrança nenhuma.
---
Rotina que funciona é a que aceita falha. Não precisa recomeçar do zero: é só cumprir a missão de hoje e marcar no app, na aba Hoje.

Se algo travou, me conta aqui que a gente ajusta juntas.`,
    `{nome}vi que faz {dias} dias sem check-in. Não vim cobrar, vim lembrar 💙
---
Falhar faz parte, e você não perdeu nada. É só fazer a missão de hoje e marcar na aba Hoje do app.

Se alguma coisa atrapalhou, me conta que a gente resolve juntas.`,
    `{nome}são {dias} dias sem marcar check-in, e está tudo bem.
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
    `{nome}fim da Semana {semana}.
---
Você passou sete dias ajustando {foco}. Repara no que mudou: inchaço ao acordar, disposição, roupa no fim do dia.

{proximo}`,
    `{nome}fechamos a Semana {semana} 💙
---
Foram sete dias mexendo em {foco}. Olha pra trás e compara: como está o inchaço de manhã, a energia, a roupa no fim do dia.

{proximo}`,
    `{nome}Semana {semana} concluída.
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
    `{nome}você chegou ao fim dos 28 dias da Rotina Zero Lipedema.
---
Suas quatro refeições principais estão ajustadas, sem dieta e sem contar caloria. Só isso já muda muita coisa no inchaço e na dor.

Se você quiser ir além, existe o passo seguinte: o Método Derma, meu acompanhamento de 90 dias com anamnese completa, leitura dos seus exames e prescrição personalizada, por R$297.

Se fizer sentido pra você, responde QUERO SABER aqui que eu te explico direitinho.`,
    `{nome}fim dos 28 dias da Rotina Zero Lipedema 💙
---
As suas quatro refeições principais já estão ajustadas, sem dieta e sem contagem de caloria. Isso sozinho costuma mudar bastante o inchaço e a dor.

Se quiser seguir, o passo seguinte é o Método Derma: 90 dias de acompanhamento comigo, com anamnese completa, leitura dos exames e prescrição personalizada, por R$297.

Se te interessa, responde QUERO SABER que eu explico como funciona.`,
    `{nome}os 28 dias da Rotina Zero Lipedema terminaram.
---
Você ajustou as quatro refeições principais sem dieta e sem contar caloria. Esse é o tipo de mudança que segura o inchaço no longo prazo.

Existe um passo além, se você quiser: o Método Derma, 90 dias de acompanhamento com anamnese, leitura de exames e prescrição feita pra você, por R$297.

Se quiser entender melhor, é só responder QUERO SABER.`,
  ],
};
