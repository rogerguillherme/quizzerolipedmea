/**
 * Dicas para cuidar do lipedema — fonte única.
 *
 * Sem JSX de propósito: o ícone é uma chave (`iconKey`) resolvida por quem
 * renderiza, para que este módulo possa ser importado em qualquer contexto.
 */

export type DicaIconKey = "utensils" | "leaf" | "heart" | "quote";

export interface Dica {
  id: string;
  titulo: string;
  descricao: string;
  iconKey: DicaIconKey;
  detalhe: string;
}

export const DICAS: readonly Dica[] = [
  {
    id: "aliados",
    titulo: "Alimentos que ajudam no dia a dia",
    descricao: "Itens simples, de qualquer mercado.",
    iconKey: "utensils",
    detalhe:
      "Frutas (banana, mamão, laranja, maçã), arroz integral, batata-doce, mandioca, ovo, frango grelhado, peixe (tilápia, sardinha), feijão, lentilha, folhas (alface, couve), brócolis, abobrinha, azeite de oliva no lugar do óleo comum, água, água de coco, chá de gengibre e chá de camomila.",
  },
  {
    id: "evitar",
    titulo: "Alimentos que costumam piorar",
    descricao: "Reduza esses itens da rotina.",
    iconKey: "leaf",
    detalhe:
      "Pão francês e pão de forma em excesso, salgadinhos de pacote, biscoito recheado, refrigerante e suco de caixinha, embutidos (presunto, salsicha, mortadela), molho de tomate pronto e caldo em cubo, frituras (salgados de padaria, batata frita), açúcar de mesa em excesso e macarrão instantâneo.",
  },
  {
    id: "refeicao",
    titulo: "Exemplo de refeições do dia",
    descricao: "Modelo para trocar dentro da mesma lógica.",
    iconKey: "heart",
    detalhe:
      "Café: pão integral + ovo mexido + mamão, ou iogurte natural + banana + castanhas. Almoço: arroz + feijão + frango grelhado + salada, ou arroz + feijão + peixe assado + abobrinha. Tarde: banana com chá de gengibre, ou maçã com um punhado de castanhas. Jantar: sopa de legumes com frango desfiado, ou omelete de claras + salada de folhas.",
  },
  {
    id: "olhos",
    titulo: "Lipedema é mudança de hábitos",
    descricao: "Aprenda a se alimentar bem sem dietas restritas.",
    iconKey: "quote",
    detalhe:
      "Quando você entende o que faz seu lipedema piorar, o controle do seu corpo está nas suas mãos, sem ficar dependendo de dietas prontas e restritivas.",
  },
] as const;

/**
 * Dica do dia: determinística pela data (YYYY-MM-DD), para não trocar a cada
 * render nem entre servidor e cliente.
 */
export function getDicaDoDia(dataISO: string): Dica {
  let h = 0;
  for (let i = 0; i < dataISO.length; i++) {
    h = (h * 31 + dataISO.charCodeAt(i)) >>> 0;
  }
  return DICAS[h % DICAS.length]!;
}
