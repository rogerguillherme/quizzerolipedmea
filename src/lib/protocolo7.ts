// Conteúdo validado do Protocolo de 7 Dias (Zero Lipedema).
// Fonte: Conteudo_Protocolo_7_Dias.docx — Dra. Gabriela Rosado (CRN 10582).
// Nunca gerar por IA em runtime; usar sempre estes modelos.

export type Regiao = "sp" | "sc" | "norte" | "outra";
export type Restricao = "nenhuma" | "sem_lactose" | "sem_gluten" | "ambas";
export type Refeicao = "cafe" | "almoco" | "tarde" | "jantar";

export const REGIOES: { id: Regiao; label: string }[] = [
  { id: "sp", label: "São Paulo / Sudeste" },
  { id: "sc", label: "Santa Catarina / Sul" },
  { id: "norte", label: "Norte / Amazônia" },
  { id: "outra", label: "Outra região" },
];

export const RESTRICOES: { id: Restricao; label: string }[] = [
  { id: "nenhuma", label: "Nenhuma" },
  { id: "sem_lactose", label: "Sem lactose" },
  { id: "sem_gluten", label: "Sem glúten" },
  { id: "ambas", label: "Sem lactose e sem glúten" },
];

export const REFEICOES: { id: Refeicao; label: string; emoji: string }[] = [
  { id: "cafe", label: "Café da manhã", emoji: "☕" },
  { id: "almoco", label: "Almoço", emoji: "🍽️" },
  { id: "tarde", label: "Lanche da tarde", emoji: "🍎" },
  { id: "jantar", label: "Jantar", emoji: "🥣" },
];

export type ContemFlag = "lactose" | "gluten" | "verificar_gluten" | "nenhum";

export type Opcao = {
  id: string;
  titulo: string;
  descricao: string;
  ingredientes: string[];
  contem: ContemFlag[];
  observacao?: string;
};

// ---------- 1. Chás e Shots (referência rápida) ----------

export type ChaShot = {
  id: string;
  nome: string;
  tipo: "cha" | "shot";
  indicacao: string;
  como: string;
  contraindicacao: string;
  ingredientesCompra: string[];
};

export const CHAS_SHOTS: ChaShot[] = [
  {
    id: "cha-drenante",
    nome: "Chá Drenante Zero — Hibisco + Cavalinha",
    tipo: "cha",
    indicacao: "Uso padrão, foco em drenagem e diurese leve.",
    como:
      "1 col. sopa de hibisco + 1 col. sopa de cavalinha para 500 ml de água quente. Infusão de 10 min, coar. Pela manhã, em jejum.",
    contraindicacao:
      "Gestante/lactante, menor de 12 anos, insuficiência renal ou cardíaca grave, gastrite/úlcera, uso contínuo de diurético.",
    ingredientesCompra: ["Hibisco seco", "Cavalinha seca"],
  },
  {
    id: "cha-calmante",
    nome: "Chá Calmante Zero — Camomila + Erva-cidreira",
    tipo: "cha",
    indicacao: "Ansiedade/estresse moderado a alto, ou sono ruim.",
    como:
      "1 col. sopa de cada para 500 ml de água quente. Infusão de 5–8 min. À noite.",
    contraindicacao:
      "Alergia a plantas da família Asteraceae (camomila); gestante avaliar com cautela.",
    ingredientesCompra: ["Camomila seca", "Erva-cidreira seca"],
  },
  {
    id: "cha-digestivo",
    nome: "Chá Digestivo Zero — Hortelã + Funcho",
    tipo: "cha",
    indicacao: "Estufamento, gases, má digestão.",
    como:
      "1 col. chá de cada para 300 ml de água quente. Infusão de 5 min. Após as refeições principais.",
    contraindicacao:
      "Refluxo importante (hortelã pode relaxar o esfíncter esofágico em alguns casos).",
    ingredientesCompra: ["Hortelã seca ou fresca", "Funcho (sementes)"],
  },
  {
    id: "shot-anti-inflamatorio",
    nome: "Shot Anti-inflamatório Zero — Limão + Gengibre + Cúrcuma",
    tipo: "shot",
    indicacao: "Perfil geral anti-inflamatório.",
    como:
      "Suco de 1 limão inteiro + 1 col. chá rasa de cúrcuma em pó + 1/2 col. chá de gengibre em pó (ou ralado), diluído em 30–50 ml de água. À noite.",
    contraindicacao:
      "Gestante/lactante, cálculos biliares, uso de anticoagulante, gastrite/refluxo/úlcera, diabetes em hipoglicemiante, problemas renais/hepáticos.",
    ingredientesCompra: ["Limão", "Cúrcuma em pó", "Gengibre fresco ou em pó"],
  },
  {
    id: "shot-detox",
    nome: "Shot Detox Zero — Beterraba + Limão + Gengibre",
    tipo: "shot",
    indicacao:
      "Maior comprometimento de pernas — foco em circulação e disposição.",
    como:
      "Beterraba pequena + suco de 1/2 limão + fatia de gengibre, batidos com 100 ml de água, coar. Pela manhã.",
    contraindicacao:
      "Histórico de cálculo renal de oxalato; hipotensão.",
    ingredientesCompra: ["Beterraba", "Limão", "Gengibre fresco"],
  },
];

// Chá padrão (compat com telas antigas): Drenante Zero.
export const CHA_INDICADO = {
  nome: CHAS_SHOTS[0].nome,
  como: CHAS_SHOTS[0].como,
  contraindicacao: CHAS_SHOTS[0].contraindicacao,
};

// ---------- 2. Refeições por região e horário ----------

const SP: Record<Refeicao, Opcao[]> = {
  cafe: [
    {
      id: "sp-c1",
      titulo: "Ovos + pão integral + fruta",
      descricao:
        "2 ovos mexidos (ou 1 ovo + queijo minas) + 1 fatia de pão integral + 1 fruta (banana/mamão) + café ou chá sem açúcar.",
      ingredientes: [
        "Ovos",
        "Queijo minas",
        "Pão integral",
        "Banana ou mamão",
        "Café ou chá",
      ],
      contem: ["lactose", "gluten"],
      observacao: "Contém lactose e glúten se usar queijo e pão.",
    },
    {
      id: "sp-c2",
      titulo: "Ovos + tapioca ou pão + fruta",
      descricao:
        "2 ovos + 2 fatias de pão integral (ou 1 tapioca média) + 1 fruta + café.",
      ingredientes: ["Ovos", "Pão integral", "Goma de tapioca", "Fruta", "Café"],
      contem: ["gluten"],
      observacao: "Contém glúten se usar pão; tapioca é sem glúten.",
    },
    {
      id: "sp-c3",
      titulo: "Mingau de aveia com chia e banana",
      descricao: "Mingau de aveia com chia e banana + café sem açúcar.",
      ingredientes: ["Aveia em flocos", "Chia", "Banana", "Café"],
      contem: ["verificar_gluten"],
      observacao: "Verificar aveia sem glúten certificada.",
    },
  ],
  almoco: [
    {
      id: "sp-a1",
      titulo: "Arroz + feijão + frango ou tilápia + salada",
      descricao:
        "Arroz + feijão carioca + 120–150g de frango grelhado ou tilápia assada + folhas e legumes + azeite.",
      ingredientes: [
        "Arroz",
        "Feijão carioca",
        "Peito de frango ou tilápia",
        "Folhas verdes",
        "Legumes",
        "Azeite de oliva",
      ],
      contem: ["nenhum"],
    },
    {
      id: "sp-a2",
      titulo: "Arroz + feijão + proteína + legumes",
      descricao:
        "Arroz + feijão + 150–180g de proteína (frango/carne magra/peixe) + legumes e folhas + azeite.",
      ingredientes: [
        "Arroz",
        "Feijão",
        "Proteína magra (frango, carne magra ou peixe)",
        "Legumes",
        "Folhas verdes",
        "Azeite de oliva",
      ],
      contem: ["nenhum"],
    },
    {
      id: "sp-a3",
      titulo: "Arroz integral + lentilha + proteína grelhada",
      descricao:
        "Arroz integral bem cozido + feijão ou lentilha bem cozida + proteína magra grelhada + legumes cozidos + azeite.",
      ingredientes: [
        "Arroz integral",
        "Lentilha",
        "Proteína magra",
        "Legumes cozidos",
        "Azeite de oliva",
      ],
      contem: ["nenhum"],
    },
  ],
  tarde: [
    {
      id: "sp-t1",
      titulo: "Iogurte + granola (ou tapioca com queijo)",
      descricao:
        "Iogurte natural + 1 col. sopa de granola sem açúcar (ou tapioca pequena com queijo minas).",
      ingredientes: [
        "Iogurte natural",
        "Granola sem açúcar",
        "Goma de tapioca",
        "Queijo minas",
      ],
      contem: ["lactose"],
    },
    {
      id: "sp-t2",
      titulo: "Banana com pasta de amendoim",
      descricao:
        "Banana com 1 col. sopa de pasta de amendoim (ou sanduíche natural).",
      ingredientes: ["Banana", "Pasta de amendoim integral", "Pão integral"],
      contem: ["verificar_gluten"],
      observacao: "Verificar pão do sanduíche se sem glúten.",
    },
    {
      id: "sp-t3",
      titulo: "Chá Digestivo Zero + fruta madura",
      descricao: "Chá Digestivo Zero (hortelã + funcho) + mamão ou banana.",
      ingredientes: ["Hortelã", "Funcho", "Mamão ou banana"],
      contem: ["nenhum"],
    },
  ],
  jantar: [
    {
      id: "sp-j1",
      titulo: "Salada + omelete ou frango + batata-doce",
      descricao:
        "Salada de folhas e legumes + omelete (2 ovos) ou frango desfiado + batata-doce ou mandioca cozida.",
      ingredientes: [
        "Folhas verdes",
        "Legumes",
        "Ovos",
        "Peito de frango",
        "Batata-doce",
        "Mandioca",
      ],
      contem: ["nenhum"],
    },
    {
      id: "sp-j2",
      titulo: "Proteína + batata-doce ou mandioca + salada",
      descricao: "Proteína + batata-doce ou mandioca + salada.",
      ingredientes: [
        "Proteína magra",
        "Batata-doce",
        "Mandioca",
        "Folhas verdes",
      ],
      contem: ["nenhum"],
    },
    {
      id: "sp-j3",
      titulo: "Sopa de legumes com proteína desfiada",
      descricao:
        "Sopa de legumes com proteína desfiada; evitar frituras e excesso de gordura à noite.",
      ingredientes: ["Legumes variados", "Peito de frango desfiado", "Azeite"],
      contem: ["nenhum"],
    },
  ],
};

const SC: Record<Refeicao, Opcao[]> = {
  cafe: [
    {
      id: "sc-c1",
      titulo: "Ovos + polenta ou pão + fruta",
      descricao:
        "2 ovos ou omelete + 2–3 fatias de polenta simples (ou pão integral) + 1 fruta (maçã/uva) + chimarrão ou café sem açúcar.",
      ingredientes: [
        "Ovos",
        "Fubá para polenta",
        "Pão integral",
        "Maçã ou uva",
        "Erva de chimarrão ou café",
      ],
      contem: ["gluten"],
      observacao: "Contém glúten se usar pão; polenta é sem glúten.",
    },
    {
      id: "sc-c2",
      titulo: "Ovos + polenta/pão + fruta (porção maior)",
      descricao:
        "Ovos + polenta ou pão integral (porção maior) + 1 fruta + chimarrão/café.",
      ingredientes: [
        "Ovos",
        "Fubá ou pão integral",
        "Fruta",
        "Erva de chimarrão ou café",
      ],
      contem: ["gluten"],
    },
    {
      id: "sc-c3",
      titulo: "Mingau de aveia com maçã e chia",
      descricao:
        "Mingau de aveia com maçã e chia + chimarrão sem açúcar em quantidade moderada.",
      ingredientes: ["Aveia em flocos", "Maçã", "Chia", "Erva de chimarrão"],
      contem: ["verificar_gluten"],
      observacao: "Verificar aveia sem glúten certificada.",
    },
  ],
  almoco: [
    {
      id: "sc-a1",
      titulo: "Arroz + feijão preto + carne suína magra ou peixe",
      descricao:
        "Arroz + feijão preto + 120–150g de carne suína magra grelhada ou peixe assado + couve refogada + salada + azeite.",
      ingredientes: [
        "Arroz",
        "Feijão preto",
        "Lombo suíno magro ou peixe",
        "Couve",
        "Folhas verdes",
        "Azeite de oliva",
      ],
      contem: ["nenhum"],
    },
    {
      id: "sc-a2",
      titulo: "Arroz + feijão preto + proteína + batata + legumes",
      descricao:
        "Arroz + feijão preto (porção maior) + 150–180g de proteína + batata (doce ou inglesa cozida) + legumes.",
      ingredientes: [
        "Arroz",
        "Feijão preto",
        "Proteína magra",
        "Batata-doce ou batata inglesa",
        "Legumes",
      ],
      contem: ["nenhum"],
    },
    {
      id: "sc-a3",
      titulo: "Arroz + feijão preto batido + proteína + couve/repolho",
      descricao:
        "Arroz bem cozido + feijão preto batido/coado + proteína magra grelhada + couve e repolho bem cozidos + azeite.",
      ingredientes: [
        "Arroz",
        "Feijão preto",
        "Proteína magra",
        "Couve",
        "Repolho",
        "Azeite de oliva",
      ],
      contem: ["nenhum"],
    },
  ],
  tarde: [
    {
      id: "sc-t1",
      titulo: "Iogurte natural + fruta",
      descricao: "Iogurte natural + fruta.",
      ingredientes: ["Iogurte natural", "Fruta"],
      contem: ["lactose"],
    },
    {
      id: "sc-t2",
      titulo: "Sanduíche natural ou fruta com pasta de amendoim",
      descricao: "Sanduíche natural ou fruta com pasta de amendoim.",
      ingredientes: ["Pão integral", "Fruta", "Pasta de amendoim integral"],
      contem: ["verificar_gluten"],
      observacao: "Verificar pão do sanduíche se sem glúten.",
    },
    {
      id: "sc-t3",
      titulo: "Chá Digestivo Zero + fruta madura",
      descricao: "Chá Digestivo Zero + fruta madura.",
      ingredientes: ["Hortelã", "Funcho", "Fruta madura"],
      contem: ["nenhum"],
    },
  ],
  jantar: [
    {
      id: "sc-j1",
      titulo: "Sopa de legumes com proteína + salada",
      descricao: "Sopa de legumes com proteína + salada de folhas.",
      ingredientes: ["Legumes variados", "Proteína magra", "Folhas verdes"],
      contem: ["nenhum"],
    },
    {
      id: "sc-j2",
      titulo: "Proteína + batata + salada",
      descricao: "Proteína + batata + salada.",
      ingredientes: [
        "Proteína magra",
        "Batata-doce ou inglesa",
        "Folhas verdes",
      ],
      contem: ["nenhum"],
    },
    {
      id: "sc-j3",
      titulo: "Sopa de legumes com proteína desfiada",
      descricao: "Sopa de legumes com proteína desfiada.",
      ingredientes: ["Legumes variados", "Frango desfiado"],
      contem: ["nenhum"],
    },
  ],
};

const NORTE: Record<Refeicao, Opcao[]> = {
  cafe: [
    {
      id: "n-c1",
      titulo: "Tapioca com ovo + açaí puro com banana",
      descricao:
        "Tapioca com ovo ou queijo coalho + açaí puro com banana (sem xarope/açúcar) + café.",
      ingredientes: [
        "Goma de tapioca",
        "Ovos",
        "Queijo coalho",
        "Açaí puro",
        "Banana",
        "Café",
      ],
      contem: ["lactose"],
      observacao: "Contém lactose se usar queijo coalho.",
    },
    {
      id: "n-c2",
      titulo: "Tapioca maior + açaí com banana e aveia",
      descricao: "Tapioca maior com ovo + açaí com banana e aveia + café.",
      ingredientes: [
        "Goma de tapioca",
        "Ovos",
        "Açaí puro",
        "Banana",
        "Aveia em flocos",
        "Café",
      ],
      contem: ["verificar_gluten"],
      observacao: "Verificar aveia sem glúten certificada.",
    },
    {
      id: "n-c3",
      titulo: "Mingau de tapioca ou aveia com açaí e chia",
      descricao:
        "Mingau de tapioca ou aveia com açaí puro (moderado) e chia.",
      ingredientes: ["Tapioca granulada", "Aveia em flocos", "Açaí puro", "Chia"],
      contem: ["verificar_gluten"],
    },
  ],
  almoco: [
    {
      id: "n-a1",
      titulo: "Arroz + feijão + peixe regional + macaxeira + jambu",
      descricao:
        "Arroz + feijão + 120–150g de peixe regional assado ou grelhado + macaxeira cozida + jambu ou folhas + azeite.",
      ingredientes: [
        "Arroz",
        "Feijão",
        "Peixe regional (tucunaré, tambaqui, tilápia)",
        "Macaxeira",
        "Jambu ou folhas verdes",
        "Azeite de oliva",
      ],
      contem: ["nenhum"],
    },
    {
      id: "n-a2",
      titulo: "Arroz + feijão + peixe ou camarão + macaxeira/farinha",
      descricao:
        "Arroz + feijão (porção maior) + 150–180g de peixe ou camarão regional + macaxeira ou farinha + legumes.",
      ingredientes: [
        "Arroz",
        "Feijão",
        "Peixe ou camarão regional",
        "Macaxeira",
        "Farinha de mandioca",
        "Legumes",
      ],
      contem: ["nenhum"],
    },
    {
      id: "n-a3",
      titulo: "Arroz + feijão coado + peixe grelhado + jambu + macaxeira",
      descricao:
        "Arroz bem cozido + feijão coado + peixe grelhado leve, sem fritura + jambu/folhas bem cozidas + macaxeira.",
      ingredientes: [
        "Arroz",
        "Feijão",
        "Peixe regional",
        "Jambu ou folhas verdes",
        "Macaxeira",
      ],
      contem: ["nenhum"],
    },
  ],
  tarde: [
    {
      id: "n-t1",
      titulo: "Fruta regional + castanhas-do-pará",
      descricao:
        "Fruta regional (cupuaçu/abacaxi/banana) + 2–3 castanhas-do-pará (não exceder).",
      ingredientes: [
        "Cupuaçu, abacaxi ou banana",
        "Castanha-do-pará",
      ],
      contem: ["nenhum"],
    },
    {
      id: "n-t2",
      titulo: "Vitamina de cupuaçu ou banana",
      descricao: "Vitamina de cupuaçu ou banana com leite/iogurte.",
      ingredientes: ["Cupuaçu ou banana", "Leite ou iogurte natural"],
      contem: ["lactose"],
    },
    {
      id: "n-t3",
      titulo: "Chá Digestivo Zero + fruta madura",
      descricao: "Chá Digestivo Zero + fruta madura.",
      ingredientes: ["Hortelã", "Funcho", "Fruta madura"],
      contem: ["nenhum"],
    },
  ],
  jantar: [
    {
      id: "n-j1",
      titulo: "Peixe grelhado + salada + macaxeira",
      descricao: "Peixe grelhado + salada + macaxeira.",
      ingredientes: [
        "Peixe regional",
        "Folhas verdes",
        "Macaxeira",
      ],
      contem: ["nenhum"],
    },
    {
      id: "n-j2",
      titulo: "Peixe + macaxeira + salada",
      descricao: "Peixe + macaxeira + salada.",
      ingredientes: ["Peixe regional", "Macaxeira", "Folhas verdes"],
      contem: ["nenhum"],
    },
    {
      id: "n-j3",
      titulo: "Peixe leve + sopa de legumes",
      descricao: "Peixe leve + sopa de legumes.",
      ingredientes: ["Peixe regional", "Legumes variados"],
      contem: ["nenhum"],
    },
  ],
};

// [regiao][refeicao] -> 3 opções.
// "outra" reaproveita o cardápio de SP como base neutra brasileira.
export const CARDAPIOS: Record<Regiao, Record<Refeicao, Opcao[]>> = {
  sp: SP,
  sc: SC,
  norte: NORTE,
  outra: SP,
};

// ---------- 3. Lista de compras — lógica de geração ----------

// Alimentos-base bons pra ter em casa, ajustados à restrição.
export function despensaBase(restricao: Restricao): string[] {
  const base = [
    "Água",
    "Frutas da estação",
    "Folhas verdes",
    "Azeite de oliva",
  ];
  if (restricao === "sem_lactose" || restricao === "ambas") {
    base.push("Leite vegetal (aveia, coco ou amêndoas)");
    base.push("Queijo ou iogurte sem lactose (opcional)");
  } else {
    base.push("Iogurte natural");
  }
  if (restricao === "sem_gluten" || restricao === "ambas") {
    base.push("Goma de tapioca / farinha de mandioca (sem glúten)");
    base.push("Pão sem glúten (opcional)");
  } else {
    base.push("Pão integral");
    base.push("Aveia em flocos");
  }
  return base;
}

function filtraIngredientesPorRestricao(
  ingredientes: string[],
  restricao: Restricao,
): string[] {
  const semLactose = restricao === "sem_lactose" || restricao === "ambas";
  const semGluten = restricao === "sem_gluten" || restricao === "ambas";
  const banidosLactose = [
    /queijo/i,
    /iogurte(?! sem lactose)/i,
    /leite(?! vegetal)/i,
  ];
  const banidosGluten = [/pão integral/i, /pão do sanduíche/i];
  return ingredientes.filter((i) => {
    if (semLactose && banidosLactose.some((r) => r.test(i))) return false;
    if (semGluten && banidosGluten.some((r) => r.test(i))) return false;
    return true;
  });
}

/**
 * Monta a lista de compras a partir de:
 * 1. Ingredientes da refeição escolhida (com filtro por restrição).
 * 2. Ingredientes do chá/shot indicado (opcional; se omitido, usa Drenante Zero).
 * 3. Itens da despensa base ajustados à restrição.
 */
export function listaDeCompras(
  refeicaoIngredientes: string[],
  restricao: Restricao,
  chaShotId?: string,
): string[] {
  const set = new Set<string>();
  filtraIngredientesPorRestricao(refeicaoIngredientes, restricao).forEach((i) =>
    set.add(i),
  );
  const cha =
    CHAS_SHOTS.find((c) => c.id === chaShotId) ?? CHAS_SHOTS[0];
  cha.ingredientesCompra.forEach((i) => set.add(i));
  despensaBase(restricao).forEach((i) => set.add(i));
  return Array.from(set);
}

// ---------- 4. Dicas de alimentação — calendário dos 7 dias ----------
// Nunca usar linguagem de proibição ou culpa. Regra 80/20.

export const DICAS_7_DIAS: { dia: number; titulo: string; texto: string }[] = [
  {
    dia: 1,
    titulo: "Ômega-3 e hidratação",
    texto:
      "Priorize fontes de ômega-3 (peixes de água fria, azeite cru) e beba água ao longo do dia. Reduza a frequência de ultraprocessados, sem culpa — regra 80/20.",
  },
  {
    dia: 2,
    titulo: "Antioxidantes e folhas",
    texto:
      "Inclua frutas vermelhas/roxas e folhas verde-escuras nas refeições — ação antioxidante e apoio ao intestino.",
  },
  {
    dia: 3,
    titulo: "Fibras",
    texto:
      "Foco em fibras: aveia, chia, linhaça e leguminosas bem cozidas apoiam o trânsito intestinal.",
  },
  {
    dia: 4,
    titulo: "Hidratação e sistema linfático",
    texto:
      "Reforce a hidratação — água, água de coco, melancia e pepino ajudam a função linfática e renal.",
  },
  {
    dia: 5,
    titulo: "Atenção ao sódio",
    texto:
      "Observe o sódio: reduza embutidos, temperos prontos e caldos em cubo, troque por ervas e especiarias.",
  },
  {
    dia: 6,
    titulo: "Proteínas magras",
    texto:
      "Proteínas magras (frango, peixe, ovos, tofu) como base das refeições principais — sem excesso de gordura saturada.",
  },
  {
    dia: 7,
    titulo: "Revisão com carinho",
    texto:
      "Revise a semana com carinho: o que ajudou a sentir menos inchaço? Sem cobrança pelo que não deu certo — é sobre direção, não perfeição.",
  },
];

// ---------- 5. Feedback diário — respostas da IA ----------

export type FeedbackResposta = "sim" | "parcial" | "nao" | "sem_resposta";

export const FEEDBACK_REPLIES: Record<FeedbackResposta, string> = {
  sim: "Isso já ajuda a reduzir o inchaço vespertino — segue assim. 💙",
  parcial:
    "Meio caminho já conta. Vou marcar como dia parcial, sem cobrança — amanhã a gente continua.",
  nao: "Tudo bem, amanhã é um novo dia. Sem julgamento — continuamos juntas.",
  sem_resposta:
    "Sem problema não responder hoje. Amanhã sigo a cadência normal por aqui.",
};

// Após 3+ dias sem resposta → escalonar em /admin (fila humana),
// nunca disparar mensagem automática de pressão.
export const ESCALONAMENTO_DIAS_SEM_RESPOSTA = 3;
