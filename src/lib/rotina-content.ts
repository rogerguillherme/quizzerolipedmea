/**
 * Rotina Zero Lipedema — fonte única do conteúdo das 4 semanas.
 *
 * Sem JSX de propósito: este arquivo também é importado por código de
 * servidor (server functions, mensagens de WhatsApp).
 */

export interface SemanaRotina {
  /** Número da semana, 1 a 4. */
  numero: 1 | 2 | 3 | 4;
  /** Refeição ajustada nesta semana. */
  refeicao: string;
  /** Objetivo da semana em uma frase. */
  objetivo: string;
  /** O que entra no prato. */
  entra: readonly string[];
  /** O que sai do prato. */
  sai: readonly string[];
  /** Regra de ouro da semana. */
  regra: string;
}

export const ROTINA_SEMANAS: readonly SemanaRotina[] = [
  {
    numero: 1,
    refeicao: "Café da manhã",
    objetivo:
      "A refeição mais fácil de controlar. É aqui que vem a primeira vitória rápida.",
    entra: [
      "Uma proteína: ovos, frango desfiado, atum ou iogurte de coco",
      "Uma fruta",
      "Uma gordura boa: abacate, azeite ou castanhas",
      "Se quiser carboidrato: tapioca, batata-doce ou banana da terra",
    ],
    sai: [
      "Pão francês e pão de forma",
      "Leite e queijo",
      "Achocolatado",
      "Biscoito e bolo",
      "Café com leite",
    ],
    regra: "Coma até ficar satisfeita. Não pese, não conte.",
  },
  {
    numero: 2,
    refeicao: "Almoço",
    objetivo:
      "A refeição de maior impacto no dia. Aqui o desinchaço começa a aparecer.",
    entra: [
      "Metade do prato de vegetais coloridos",
      "Uma proteína à vontade: carne, frango, peixe ou ovo",
      "Arroz e feijão liberados",
      "Azeite por cima",
    ],
    sai: [
      "Molhos prontos e molhos brancos",
      "Empanados e à milanesa",
      "Queijo ralado e requeijão",
      "Creme de leite",
      "Macarrão de trigo",
      "Pão que acompanha",
    ],
    regra:
      "Repita o prato se tiver fome. O que muda é o que está no prato, não o quanto.",
  },
  {
    numero: 3,
    refeicao: "Lanche",
    objetivo:
      "É onde aparecem os gatilhos e os escapes. Esta semana se ganha na preparação, não na força de vontade.",
    entra: [
      "Fruta com uma gordura: banana com pasta de amendoim, maçã com castanha",
      "Ovo cozido",
      "Iogurte de coco",
      "Chá",
      "Café puro",
    ],
    sai: [
      "Biscoito e bolacha, mesmo integral",
      "Barrinha de cereal",
      "Pão no meio da tarde",
      "Café com leite",
      "Refrigerante e suco de caixinha",
    ],
    regra:
      "Deixe duas opções prontas na geladeira no domingo. Fome sem opção pronta é o que quebra a rotina.",
  },
  {
    numero: 4,
    refeicao: "Jantar",
    objetivo:
      "Fecha o ciclo. É a refeição que mais muda como você acorda: inchaço, peso nas pernas e disposição.",
    entra: [
      "Proteína com vegetais cozidos ou refogados",
      "Sopas e caldos sem creme",
      "Jantar até 2h antes de deitar",
    ],
    sai: [
      "Excesso de carboidrato à noite",
      "Frituras",
      "Queijo",
      "Vinho e álcool",
      "Comer deitada ou já na cama",
    ],
    regra:
      "Jantar mais leve que o almoço. Você vai sentir a diferença na primeira manhã.",
  },
] as const;

/** Meta de dias de check-in por semana. */
export const META_DIAS_SEMANA = 7;
/** Mínimo de check-ins para liberar o avanço automático de semana. */
export const MIN_DIAS_AVANCAR = 5;

/** Frases curtas de reforço mostradas depois do check-in do dia. */
export const FRASES_REFORCO: readonly string[] = [
  "Mais um dia no lugar certo. É assim que muda.",
  "Constância vale mais que perfeição.",
  "Seu corpo registra cada dia desses.",
  "Você não está fazendo dieta. Está construindo rotina.",
  "Um dia por vez, e a semana se resolve sozinha.",
  "Isso aqui é o que faz o inchaço ceder.",
  "Sem pressa e sem culpa. Só continue.",
];

export function getSemana(numero: number): SemanaRotina {
  return (
    ROTINA_SEMANAS.find((s) => s.numero === numero) ?? ROTINA_SEMANAS[0]!
  );
}
