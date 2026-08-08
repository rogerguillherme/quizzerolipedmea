/**
 * Conteúdo dos 3 guias entregues no Plano Zero Lipedema (R$67).
 *
 * Fonte única, sem JSX: as telas (`/app/guias` e `/app/guias/$slug`) apenas
 * renderizam estas estruturas. Qualquer ajuste de texto acontece aqui.
 *
 * Conformidade (não alterar sem checar com a Gabriela):
 * - Nenhum manipulado ou fitoterápico prescrito (bloqueados hoje).
 * - Suplemento entra apenas como conteúdo educativo, sem dose e sem indicação
 *   individual.
 */

export type GuiaSlug = "plano-alimentar" | "guia-natural" | "desinchando";

/** Bloco de texto corrido, com parágrafos. */
export interface BlocoTexto {
  tipo: "texto";
  titulo?: string;
  paragrafos: readonly string[];
  /** Destaque visual (card navy). Usado na abertura e no fechamento. */
  destaque?: boolean;
}

/** Lista numerada de opções prontas (cardápio). */
export interface BlocoOpcoes {
  tipo: "opcoes";
  titulo: string;
  legenda?: string;
  itens: readonly string[];
}

/** Tabela de duas colunas: "no lugar de" → "use". */
export interface BlocoSubstituicoes {
  tipo: "substituicoes";
  titulo: string;
  itens: readonly { de: string; para: string }[];
}

/** Lista de compras agrupada por categoria. */
export interface BlocoCompras {
  tipo: "compras";
  titulo: string;
  grupos: readonly { nome: string; itens: readonly string[] }[];
}

/** Receita de chá ou shot, com aviso de contraindicação. */
export interface BlocoReceita {
  tipo: "receita";
  nome: string;
  paraQue: string;
  preparo: string;
  quando: string;
  naoIndicado: string;
}

/** Hábito do dia a dia: nome, por quê e como. */
export interface BlocoHabitos {
  tipo: "habitos";
  titulo: string;
  itens: readonly { n: number; nome: string; porque: string; como: string }[];
}

export type Bloco =
  | BlocoTexto
  | BlocoOpcoes
  | BlocoSubstituicoes
  | BlocoCompras
  | BlocoReceita
  | BlocoHabitos;

export interface Guia {
  slug: GuiaSlug;
  titulo: string;
  subtitulo: string;
  /** Chamada curta usada nos cards de descoberta. */
  resumo: string;
  /** Chave de ícone resolvida na camada de UI (evita JSX aqui). */
  iconKey: "utensils" | "leaf" | "droplets";
  blocos: readonly Bloco[];
  /** Rodapé de conformidade, quando exigido. */
  rodape?: string;
}

const RODAPE_CRN =
  "Orientação nutricional de caráter educativo. Não substitui consulta individual. Gabriela Rosado · CRN 10582.";

const PLANO_ALIMENTAR: Guia = {
  slug: "plano-alimentar",
  titulo: "Plano alimentar anti-inflamatório",
  subtitulo:
    "O padrão base da Rotina. Não é personalizado, o personalizado é do Acompanhamento.",
  resumo: "Café, almoço, lanche e jantar dentro do padrão sem glúten e sem lactose.",
  iconKey: "utensils",
  blocos: [
    {
      tipo: "texto",
      titulo: "A regra do prato",
      destaque: true,
      paragrafos: [
        "Toda refeição principal tem: uma proteína (à vontade) + vegetais ou fruta + uma gordura boa.",
        "Sem glúten e sem lactose. Sem contar caloria e sem pesar comida.",
      ],
    },
    {
      tipo: "opcoes",
      titulo: "Café da manhã",
      legenda: "3 opções prontas",
      itens: [
        "Ovos mexidos no azeite + abacate + café puro",
        "Tapioca com frango desfiado + 1 fruta",
        "Iogurte de coco com fruta vermelha e castanhas",
      ],
    },
    {
      tipo: "opcoes",
      titulo: "Almoço",
      legenda: "3 opções prontas",
      itens: [
        "Frango grelhado + arroz + feijão + salada de folhas com azeite",
        "Peixe assado + purê de mandioca + legumes refogados",
        "Carne moída com abobrinha e cenoura + arroz + salada",
      ],
    },
    {
      tipo: "opcoes",
      titulo: "Lanche",
      legenda: "3 opções prontas",
      itens: [
        "Banana com pasta de amendoim (só amendoim e sal)",
        "Ovo cozido + 1 fruta",
        "Punhado de castanhas + chá",
      ],
    },
    {
      tipo: "opcoes",
      titulo: "Jantar",
      legenda: "3 opções prontas",
      itens: [
        "Omelete de 2 ovos com espinafre + salada",
        "Sopa de legumes com frango desfiado, sem creme",
        "Peixe grelhado + legumes cozidos",
      ],
    },
    {
      tipo: "substituicoes",
      titulo: "Tabela de substituições",
      itens: [
        { de: "Pão francês", para: "Tapioca, batata-doce, mandioca cozida" },
        { de: "Leite", para: "Leite de coco, leite de castanha" },
        { de: "Queijo e requeijão", para: "Abacate, azeite, pasta de castanha" },
        { de: "Macarrão de trigo", para: "Macarrão de arroz, abobrinha em tiras" },
        { de: "Biscoito", para: "Castanhas, fruta com pasta de amendoim" },
        { de: "Achocolatado", para: "Cacau em pó com leite vegetal" },
        { de: "Molho branco", para: "Azeite com alho e ervas" },
        { de: "Suco de caixinha", para: "Fruta inteira, água com limão" },
        { de: "Margarina", para: "Azeite, manteiga ghee" },
        { de: "Adoçante em pó", para: "Nada, ou fruta madura" },
      ],
    },
    {
      tipo: "compras",
      titulo: "Lista de compras",
      grupos: [
        {
          nome: "Proteínas",
          itens: [
            "Ovos",
            "Frango (peito e coxa)",
            "Carne moída",
            "Peixe",
            "Iogurte de coco",
          ],
        },
        {
          nome: "Vegetais e frutas",
          itens: [
            "Folhas para salada",
            "Abobrinha",
            "Cenoura",
            "Espinafre",
            "Legumes para sopa",
            "Banana",
            "Frutas vermelhas",
            "Limão",
            "Frutas da estação",
          ],
        },
        {
          nome: "Gorduras",
          itens: [
            "Azeite de oliva",
            "Abacate",
            "Castanhas",
            "Pasta de amendoim (só amendoim e sal)",
            "Manteiga ghee",
          ],
        },
        {
          nome: "Carboidratos",
          itens: [
            "Arroz",
            "Feijão",
            "Goma de tapioca",
            "Batata-doce",
            "Mandioca",
            "Macarrão de arroz",
          ],
        },
        {
          nome: "Temperos e bebidas",
          itens: [
            "Alho e cebola",
            "Ervas frescas ou secas",
            "Sal",
            "Cacau em pó",
            "Leite de coco ou de castanha",
            "Café",
            "Chás",
          ],
        },
      ],
    },
    {
      tipo: "texto",
      titulo: "A regra 80/20",
      destaque: true,
      paragrafos: [
        "Isto não é lista de proibição. Comer bem na maior parte do tempo funciona, perfeição não.",
        "Um dia fora não apaga a semana. Volte na próxima refeição e siga.",
      ],
    },
  ],
};

const GUIA_NATURAL: Guia = {
  slug: "guia-natural",
  titulo: "Guia Natural Zero Lipedema",
  subtitulo: "Chás e shots caseiros que apoiam a Rotina.",
  resumo: "Chás e shots caseiros, com preparo, horário e quem não deve tomar.",
  iconKey: "leaf",
  blocos: [
    {
      tipo: "receita",
      nome: "Chá Drenante Zero · hibisco + cavalinha",
      paraQue: "Drenagem e diurese leve. É o chá de uso geral do método.",
      preparo:
        "1 col. de sopa de hibisco + 1 col. de sopa de cavalinha em 500 ml de água quente, 10 min de infusão, coar.",
      quando: "Pela manhã, em jejum.",
      naoIndicado:
        "Gestante ou lactante, menor de 12 anos, insuficiência renal ou cardíaca grave, gastrite ou úlcera, quem usa diurético de forma contínua.",
    },
    {
      tipo: "receita",
      nome: "Chá Calmante Zero · camomila + erva-cidreira",
      paraQue: "Ansiedade, estresse e sono ruim, que também pioram o inchaço.",
      preparo: "1 col. de sopa de cada em 500 ml de água quente, 5 a 8 min.",
      quando: "À noite.",
      naoIndicado:
        "Alergia a plantas da família da camomila. Gestante, com avaliação.",
    },
    {
      tipo: "receita",
      nome: "Chá Digestivo Zero · hortelã + funcho",
      paraQue: "Estufamento, gases e má digestão.",
      preparo: "1 col. de chá de cada em 300 ml de água quente, 5 min.",
      quando: "Depois das refeições principais.",
      naoIndicado: "Quem tem refluxo importante.",
    },
    {
      tipo: "receita",
      nome: "Shot Anti-inflamatório Zero · limão + gengibre + cúrcuma",
      paraQue: "Apoio anti-inflamatório geral.",
      preparo:
        "Suco de 1 limão + 1 col. de chá rasa de cúrcuma em pó + ½ col. de chá de gengibre, em 30 a 50 ml de água.",
      quando: "À noite.",
      naoIndicado:
        "Gestante ou lactante, cálculo biliar, uso de anticoagulante, gastrite, refluxo ou úlcera, diabetes em uso de hipoglicemiante, problema renal ou hepático.",
    },
    {
      tipo: "receita",
      nome: "Shot Detox Zero · beterraba + limão + gengibre",
      paraQue: "Circulação e disposição.",
      preparo:
        "1 beterraba pequena + suco de ½ limão + 1 fatia de gengibre batidos com 100 ml de água, coar.",
      quando: "Pela manhã.",
      naoIndicado: "Histórico de cálculo renal de oxalato, pressão baixa.",
    },
    {
      tipo: "texto",
      titulo: "Suplementos",
      paragrafos: [
        "Suplemento é o que complementa o que a alimentação não está dando conta de entregar. No lipedema, quatro costumam aparecer nas conversas: vitamina D, ômega 3, magnésio e probiótico.",
        "Vitamina D e ômega 3 entram pelo lado inflamatório, magnésio costuma aparecer quando há dor, cãibra e sono ruim, e o probiótico quando o intestino não vai bem.",
        "Dose e indicação dependem dos seus exames e do seu caso. É isso que eu faço no Acompanhamento Zero Lipedema, olhando os seus resultados antes de indicar qualquer coisa.",
      ],
    },
  ],
  rodape: RODAPE_CRN,
};

const DESINCHANDO: Guia = {
  slug: "desinchando",
  titulo: "Guia Desinchando na Prática",
  subtitulo: "O que fazer no dia a dia para as pernas pesarem menos.",
  resumo: "12 hábitos simples, do acordar até a hora de dormir.",
  iconKey: "droplets",
  blocos: [
    {
      tipo: "habitos",
      titulo: "Ao acordar",
      itens: [
        {
          n: 1,
          nome: "Beba 500 ml de água antes do café",
          porque: "A noite inteira sem líquido concentra a retenção.",
          como: "O primeiro copo do dia destrava. Beba antes de qualquer outra coisa.",
        },
        {
          n: 2,
          nome: "Movimente os tornozelos antes de levantar",
          porque: "A panturrilha é a bomba que empurra o líquido de volta.",
          como: "Deitada, 20 movimentos de pé para cima e para baixo.",
        },
        {
          n: 3,
          nome: "Ducha fria nas pernas no fim do banho",
          porque: "O frio estimula o retorno venoso e alivia o peso.",
          como: "30 segundos de água fria do joelho para baixo, de baixo para cima.",
        },
      ],
    },
    {
      tipo: "habitos",
      titulo: "Durante o dia",
      itens: [
        {
          n: 4,
          nome: "Não fique mais de 1 hora parada na mesma posição",
          porque: "Parada, em pé ou sentada, o líquido acumula nas pernas.",
          como: "Levante, ande 2 minutos, volte.",
        },
        {
          n: 5,
          nome: "Meia de compressão nos dias de mais tempo em pé",
          porque: "A compressão sustenta o retorno enquanto você está de pé.",
          como: "Vista de manhã, antes de as pernas incharem. A indicação da compressão certa é médica.",
        },
        {
          n: 6,
          nome: "Água ao longo do dia, não de uma vez",
          porque: "Beber pouco é o que retém, não o contrário.",
          como: "Uma garrafa por perto e goles ao longo do dia.",
        },
        {
          n: 7,
          nome: "Reduza o sal escondido",
          porque: "Molho pronto, caldo em cubo, embutido e enlatado pesam mais que o saleiro.",
          como: "Troque por alho, cebola, ervas e limão.",
        },
        {
          n: 8,
          nome: "Caminhe 20 minutos",
          porque: "O melhor movimento para o sistema linfático é o mais simples.",
          como: "Ritmo confortável, sem precisar de academia.",
        },
      ],
    },
    {
      tipo: "habitos",
      titulo: "À noite",
      itens: [
        {
          n: 9,
          nome: "Pernas para cima por 15 minutos",
          porque: "A gravidade faz o trabalho de drenagem por você.",
          como: "Deitada, pernas apoiadas na parede ou em travesseiros acima do coração.",
        },
        {
          n: 10,
          nome: "Jantar mais leve e mais cedo",
          porque: "É o que mais muda o inchaço da manhã seguinte.",
          como: "Proteína e legumes, sem fritura, pelo menos 2 horas antes de deitar.",
        },
        {
          n: 11,
          nome: "Tire a roupa apertada em casa",
          porque: "Cós, elástico de meia e legging justa marcam e travam o retorno.",
          como: "Chegou em casa, troque por roupa folgada.",
        },
        {
          n: 12,
          nome: "Durma com os pés levemente elevados",
          porque: "A noite inteira em leve elevação reduz o inchaço da manhã.",
          como: "Um travesseiro fino sob o colchão, no pé da cama.",
        },
      ],
    },
    {
      tipo: "texto",
      destaque: true,
      paragrafos: [
        "Nenhum desses hábitos resolve sozinho. O que funciona é o conjunto, repetido.",
        "Escolha dois para começar esta semana.",
      ],
    },
  ],
};

export const GUIAS: readonly Guia[] = [PLANO_ALIMENTAR, GUIA_NATURAL, DESINCHANDO] as const;

export function getGuia(slug: string): Guia | undefined {
  return GUIAS.find((g) => g.slug === slug);
}
