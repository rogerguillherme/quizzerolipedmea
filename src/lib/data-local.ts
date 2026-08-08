/**
 * Definição única de "hoje" para o app inteiro (Hoje, Rotina, Progresso e
 * registro de refeições).
 *
 * Motivo: o servidor roda em UTC e o navegador usa o fuso do aparelho. Se cada
 * tela calculasse o dia por conta própria, um check-in feito às 22h em São Paulo
 * apareceria no dia seguinte (UTC) ou em telas diferentes. Tudo aqui é ancorado
 * em America/Sao_Paulo.
 */

export const TZ = "America/Sao_Paulo";

const FMT_ISO = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD de uma data qualquer, no fuso de São Paulo. */
export function isoLocal(d: Date = new Date()): string {
  return FMT_ISO.format(d);
}

/** YYYY-MM-DD de agora, no fuso de São Paulo. */
export function hojeISO(): string {
  return isoLocal(new Date());
}

/** Hora do dia (0-23) em São Paulo, independente do fuso do aparelho. */
export function horaLocal(d: Date = new Date()): number {
  const h = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    hour12: false,
  }).format(d);
  const n = Number(h);
  return Number.isFinite(n) ? n : 0;
}

/** Ex.: "sábado, 8 de agosto" no fuso de São Paulo. */
export function dataExtenso(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

/** Diferença em dias entre duas datas YYYY-MM-DD (a - b). */
export function diasEntre(aISO: string, bISO: string): number {
  const a = Date.parse(`${aISO}T00:00:00Z`);
  const b = Date.parse(`${bISO}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((a - b) / 86_400_000);
}
