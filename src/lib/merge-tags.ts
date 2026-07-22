/**
 * Parâmetros disponíveis para as mensagens dos funis.
 * Puxamos direto do formulário do Mapa do Lipedema (tabela `leads`)
 * e do diagnóstico gerado pela IA.
 */

export type MergeTag = {
  key: string;
  label: string;
  exemplo: string;
  descricao: string;
};

export const MERGE_TAGS: MergeTag[] = [
  { key: "nome", label: "Nome completo", exemplo: "Maria Silva", descricao: "Nome informado no quiz" },
  { key: "primeiro_nome", label: "Primeiro nome", exemplo: "Maria", descricao: "Só o primeiro nome" },
  { key: "telefone", label: "WhatsApp", exemplo: "+55 11 99999-9999", descricao: "Número informado" },
  { key: "estagio", label: "Estágio percebido", exemplo: "Estágio 2", descricao: "Diagnóstico da IA" },
  { key: "tempo", label: "Q1 · Tempo com sintomas", exemplo: "5-10 anos", descricao: "Resposta da pergunta 1" },
  { key: "diagnostico", label: "Q2 · Já tem diagnóstico?", exemplo: "Sim, confirmado", descricao: "Resposta da pergunta 2" },
  { key: "sintomaMaior", label: "Q3 · Sintoma principal", exemplo: "Dor nas pernas", descricao: "Resposta da pergunta 3" },
  { key: "pesoPernas", label: "Q4 · Peso nas pernas", exemplo: "Sim, sempre", descricao: "Resposta da pergunta 4" },
  { key: "dietaExercicio", label: "Q5 · Dieta/exercício", exemplo: "Não mudou nada", descricao: "Resposta da pergunta 5" },
  { key: "atividade", label: "Q6 · Nível de atividade", exemplo: "Sedentária", descricao: "Resposta da pergunta 6" },
  { key: "exames", label: "Q7 · Já fez exames", exemplo: "Não", descricao: "Resposta da pergunta 7" },
  { key: "objetivo", label: "Q8 · Objetivo principal", exemplo: "Aliviar a dor", descricao: "Resposta da pergunta 8" },
];

export type LeadLike = {
  nome?: string | null;
  telefone?: string | null;
  respostas?: Record<string, unknown> | null;
  diagnostico?: { estagio?: string } | null;
};

/** Substitui `{tag}` pelos valores do lead. Tags sem valor viram string vazia. */
export function applyMergeTags(texto: string, lead: LeadLike): string {
  if (!texto) return "";
  const nome = (lead.nome ?? "").trim();
  const respostas = (lead.respostas ?? {}) as Record<string, string>;
  const map: Record<string, string> = {
    nome,
    primeiro_nome: nome.split(" ")[0] ?? "",
    telefone: lead.telefone ?? "",
    estagio: lead.diagnostico?.estagio ?? "",
    tempo: respostas.tempo ?? "",
    diagnostico: respostas.diagnostico ?? "",
    sintomaMaior: respostas.sintomaMaior ?? "",
    pesoPernas: respostas.pesoPernas ?? "",
    dietaExercicio: respostas.dietaExercicio ?? "",
    atividade: respostas.atividade ?? "",
    exames: respostas.exames ?? "",
    objetivo: respostas.objetivo ?? "",
  };
  return texto.replace(/\{(\w+)\}/g, (_, k: string) =>
    Object.prototype.hasOwnProperty.call(map, k) ? map[k] : `{${k}}`,
  );
}
