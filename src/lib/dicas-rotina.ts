/**
 * Dicas diárias da Rotina Zero Lipedema.
 *
 * 28 dicas, 7 por semana, amarradas à refeição ajustada naquela semana.
 * Usadas na cadência pós-compra do WhatsApp (cron-tick) e disponíveis para o
 * app. Sem JSX de propósito: também é importado por código de servidor.
 */

export interface DicaRotina {
  /** Dia da rotina, 1 a 28. */
  dia: number;
  /** Semana correspondente. */
  semana: 1 | 2 | 3 | 4;
  /** Texto da dica, pronto para enviar. */
  texto: string;
}

export const DICAS_ROTINA: readonly DicaRotina[] = [
  // Semana 1 — Café da manhã
  {
    dia: 1,
    semana: 1,
    texto:
      "A troca começa hoje: proteína, uma fruta e uma gordura boa. Na dúvida, ovo com abacate resolve.",
  },
  {
    dia: 2,
    semana: 1,
    texto:
      "Se você tira o pão e não põe nada no lugar, a fome chega às 10h. Tapioca, batata-doce ou banana da terra ocupam esse espaço.",
  },
  {
    dia: 3,
    semana: 1,
    texto:
      "Café com leite é o hábito mais difícil de largar. Comece com café puro ou com leite de coco. Não precisa ser bonito, precisa ser possível.",
  },
  {
    dia: 4,
    semana: 1,
    texto:
      "Deixe o café da manhã decidido na noite anterior. Decisão tomada com sono quase sempre vira pão.",
  },
  {
    dia: 5,
    semana: 1,
    texto:
      "Fome no meio da manhã quase sempre é falta de proteína no café, não falta de força de vontade.",
  },
  {
    dia: 6,
    semana: 1,
    texto:
      "Fim de semana conta, mas com folga. Se hoje sair da rota, o café de amanhã resolve.",
  },
  {
    dia: 7,
    semana: 1,
    texto:
      "Sete dias de café ajustado. Repare em como você está acordando, o inchaço da manhã costuma ser o primeiro a ceder.",
  },

  // Semana 2 — Almoço
  {
    dia: 8,
    semana: 2,
    texto:
      "Agora o almoço: metade do prato de vegetais, proteína à vontade, arroz e feijão liberados.",
  },
  {
    dia: 9,
    semana: 2,
    texto:
      "O que atrapalha no almoço quase nunca é o arroz. É o molho pronto, o empanado e o queijo.",
  },
  {
    dia: 10,
    semana: 2,
    texto: "Marmita salva a semana. Cozinhe a proteína de três dias de uma vez.",
  },
  {
    dia: 11,
    semana: 2,
    texto: "Pode repetir o prato. O que muda é o que está nele, não o quanto.",
  },
  {
    dia: 12,
    semana: 2,
    texto:
      "Almoço fora: peça grelhado, comece pela salada e deixe o pãozinho de lado.",
  },
  {
    dia: 13,
    semana: 2,
    texto: "Azeite cru por cima, no fim. Simples, e é aí que estão os polifenóis.",
  },
  {
    dia: 14,
    semana: 2,
    texto:
      "Duas refeições ajustadas. É aqui que a maioria começa a sentir as pernas mais leves à tarde.",
  },

  // Semana 3 — Lanche
  {
    dia: 15,
    semana: 3,
    texto:
      "Semana do lanche, a que mais quebra rotina. Essa a gente ganha na preparação, não na força de vontade.",
  },
  {
    dia: 16,
    semana: 3,
    texto:
      "Deixe duas opções prontas na geladeira hoje. Ovo cozido e fruta com castanha resolvem a maior parte dos escapes.",
  },
  {
    dia: 17,
    semana: 3,
    texto:
      "Biscoito integral continua sendo biscoito. Não é proibido, mas não é lanche de rotina.",
  },
  {
    dia: 18,
    semana: 3,
    texto:
      "Fome às 16h muitas vezes é sede. Beba água e espere dez minutos antes de decidir.",
  },
  {
    dia: 19,
    semana: 3,
    texto:
      "Vontade de doce à tarde costuma ser sinal de almoço pobre em proteína. Ajuste o almoço, não a força de vontade.",
  },
  {
    dia: 20,
    semana: 3,
    texto:
      "Se comeu o que não queria, não compense pulando o jantar. Compensar é o que trava o processo.",
  },
  { dia: 21, semana: 3, texto: "Três refeições no lugar. Falta uma." },

  // Semana 4 — Jantar
  {
    dia: 22,
    semana: 4,
    texto: "Última semana: o jantar. É a refeição que mais muda como você acorda.",
  },
  {
    dia: 23,
    semana: 4,
    texto: "Jantar mais leve que o almoço. Proteína com legumes cozidos já basta.",
  },
  {
    dia: 24,
    semana: 4,
    texto: "Duas horas entre o jantar e a cama. Se não der, jante menos.",
  },
  {
    dia: 25,
    semana: 4,
    texto:
      "Álcool retém líquido e sobrecarrega o fígado. Se for beber, beba água junto e não faça disso rotina.",
  },
  {
    dia: 26,
    semana: 4,
    texto: "Sopa e caldo sem creme são o melhor jantar de dia corrido.",
  },
  {
    dia: 27,
    semana: 4,
    texto:
      "Pernas para cima por quinze minutos antes de dormir. Amanhã você sente.",
  },
  {
    dia: 28,
    semana: 4,
    texto:
      "Quatro semanas. Suas quatro refeições principais estão ajustadas, sem dieta e sem contar caloria.",
  },
] as const;

/** Dicas de uma semana específica, em ordem. */
export function dicasDaSemana(semana: number): readonly DicaRotina[] {
  return DICAS_ROTINA.filter((d) => d.semana === semana);
}

/**
 * Dica a enviar no dia `dia` desde a compra, respeitando a semana que a
 * paciente realmente está vivendo.
 *
 * Se ela está no dia 10 mas ainda na Semana 1, recebe a 3ª dica da Semana 1,
 * nunca conteúdo de uma semana que ela não começou.
 */
export function dicaParaDia(
  diaDesdeCompra: number,
  semanaAtual: number,
): DicaRotina | null {
  if (!Number.isFinite(diaDesdeCompra) || diaDesdeCompra < 1) return null;
  const semana = Math.min(4, Math.max(1, Math.floor(semanaAtual) || 1));
  const daSemana = dicasDaSemana(semana);
  if (daSemana.length === 0) return null;

  const direta = DICAS_ROTINA.find((d) => d.dia === diaDesdeCompra);
  if (direta && direta.semana === semana) return direta;

  // Fora de sincronia: cicla dentro da semana vivida, sem repetir no mesmo dia.
  const idx = (Math.floor(diaDesdeCompra) - 1) % daSemana.length;
  return daSemana[idx] ?? null;
}
