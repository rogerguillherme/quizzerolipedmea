/**
 * Pontos de atenção do Mapa do Lipedema.
 *
 * Regras auditáveis: cada item casa por palavra-chave dentro do texto da
 * resposta do quiz, sem diferenciar maiúsculas nem acentos. São informativos,
 * não diagnósticos — descrevem o que a própria paciente relatou.
 *
 * A ordem do array é a ordem de prioridade; no máximo 3 chips aparecem.
 */

export interface RegraAtencao {
  /** Chave da resposta no objeto `respostas` do Mapa. */
  campo: string;
  /** Palavras-chave (já sem acento, minúsculas) que ativam o chip. */
  termos: readonly string[];
  /** Texto exibido no chip. */
  chip: string;
}

export const REGRAS_ATENCAO: readonly RegraAtencao[] = [
  {
    campo: "dorNivel",
    termos: ["alta", "forte", "muito", "diaria"],
    chip: "Dor presente no dia a dia",
  },
  {
    campo: "dietaExercicio",
    termos: ["sim", "ja tentei", "nao vi", "nao mudou"],
    chip: "Dieta e treino já tentados sem resultado",
  },
  {
    campo: "intestino",
    termos: ["preso", "constipa", "raram", "a cada"],
    chip: "Intestino irregular",
  },
  {
    campo: "sinaisNutricionais",
    termos: ["sim", "queda", "unha", "cansaco", "varios"],
    chip: "Sinais de carência nutricional",
  },
  {
    campo: "sono",
    termos: ["ruim", "pessimo", "pouco", "acordo"],
    chip: "Sono desregulado",
  },
  {
    campo: "pesoPernas",
    termos: ["sim"],
    chip: "O peso muda, as pernas não",
  },
  {
    campo: "atividade",
    termos: ["sedentaria", "parada", "nao pratico"],
    chip: "Pouco movimento no dia",
  },
  {
    campo: "exames",
    termos: ["nao"],
    chip: "Sem exames recentes",
  },
] as const;

/** Normaliza para comparação: minúsculas, sem acento e sem espaços extras. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deriva até 3 pontos de atenção das respostas do Mapa.
 * Retorna array vazio quando nenhuma regra bate (a seção não deve ser exibida).
 */
export function derivarPontosAtencao(
  respostas: Record<string, unknown> | null | undefined,
  limite = 3,
): string[] {
  if (!respostas) return [];
  const chips: string[] = [];

  for (const regra of REGRAS_ATENCAO) {
    if (chips.length >= limite) break;
    const bruto = respostas[regra.campo];
    if (typeof bruto !== "string" || !bruto.trim()) continue;
    const valor = normalizar(bruto);
    if (regra.termos.some((t) => valor.includes(t))) {
      chips.push(regra.chip);
    }
  }

  return chips;
}
