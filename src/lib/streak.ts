/**
 * Textos da sequência (streak) com tom de retomada, nunca de perda.
 *
 * Regras de produto:
 * - Nunca escrever "0 dias seguidos".
 * - Quando a sequência quebra, a mensagem fala do total acumulado, que nunca cai.
 */
export function textoSequencia(sequencia: number, total: number): string {
  if (sequencia <= 0) {
    if (total <= 0) return "Vamos começar hoje";
    return `Sequência recomeçada. O que conta é o total: ${total} ${
      total === 1 ? "dia" : "dias"
    } no seu histórico.`;
  }
  const seq = `${sequencia} ${sequencia === 1 ? "dia seguido" : "dias seguidos"}`;
  if (total > sequencia) {
    return `${seq} · ${total} no total`;
  }
  return seq;
}

/** Rótulo curto do número da sequência (usado em cartões de destaque). */
export function rotuloSequencia(sequencia: number): string {
  if (sequencia <= 0) return "Vamos começar hoje";
  return sequencia === 1 ? "dia seguido" : "dias seguidos";
}
