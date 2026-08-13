/** Rótulos e helpers de apresentação do CRM (client-safe). */

export type Etapa =
  | "mapa_feito"
  | "em_conversa"
  | "quer_saber_mais"
  | "cliente"
  | "sem_resposta";

export const ETAPAS: Array<{ id: Etapa; label: string; dica: string }> = [
  { id: "mapa_feito", label: "Mapa feito", dica: "Fez o quiz, ainda não trocou mensagem" },
  { id: "em_conversa", label: "Em conversa", dica: "Já respondeu alguma coisa" },
  { id: "quer_saber_mais", label: "Quer saber mais", dica: "Demonstrou intenção de compra" },
  { id: "cliente", label: "Cliente", dica: "Plano ativo" },
  { id: "sem_resposta", label: "Sem resposta", dica: "Silêncio há mais de 7 dias" },
];

/** Rótulos em português das 12 perguntas do Mapa. */
export const LABELS_Q: Record<string, string> = {
  tempo: "Estágio percebido nas pernas",
  diagnostico: "Diagnóstico",
  sintomaMaior: "Sintoma principal",
  dorNivel: "Nível de dor",
  pesoPernas: "Peso × pernas",
  dietaExercicio: "Dieta & exercício",
  atividade: "Nível de atividade",
  sono: "Sono",
  intestino: "Intestino",
  sinaisNutricionais: "Sinais nutricionais",
  exames: "Exames recentes",
  objetivo: "Objetivo",
};

export const ORDEM_Q = Object.keys(LABELS_Q);

export function primeiroNome(nome: string | null | undefined, fallback = "Sem nome") {
  const n = String(nome ?? "").trim();
  if (!n) return fallback;
  return n.split(/\s+/)[0];
}

export function haQuantoTempo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  const min = Math.floor((Date.now() - t) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} d`;
  return new Date(t).toLocaleDateString("pt-BR");
}

export function dataCurta(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const STATUS_LEAD: Record<string, string> = {
  mapa_gerado: "Mapa gerado",
  acesso_criado: "Acesso criado",
  plano_ativo: "Plano ativo",
};

export function rotuloStatusLead(s: string | null | undefined) {
  if (!s) return "—";
  return STATUS_LEAD[s] ?? s;
}
