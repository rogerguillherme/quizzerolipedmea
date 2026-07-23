// Modelos regionais validados do Protocolo de 7 Dias.
// Não gerar por IA em runtime — usar sempre estes cardápios.

export type Regiao = "sp" | "sc" | "norte" | "outra";
export type Restricao = "nenhuma" | "sem_lactose" | "sem_gluten" | "ambas";
export type Refeicao = "cafe" | "almoco" | "tarde" | "jantar";

export const REGIOES: { id: Regiao; label: string }[] = [
  { id: "sp", label: "São Paulo" },
  { id: "sc", label: "Santa Catarina" },
  { id: "norte", label: "Norte" },
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

export type Opcao = {
  id: string;
  titulo: string;
  descricao: string;
  ingredientes: string[];
};

// [regiao][refeicao] -> 3 opções
export const CARDAPIOS: Record<Regiao, Record<Refeicao, Opcao[]>> = {
  sp: {
    cafe: [
      { id: "sp-c1", titulo: "Tapioca com ovo e mamão", descricao: "Recheio de ovo mexido com orégano + mamão papaia.", ingredientes: ["Goma de tapioca", "Ovos", "Mamão papaia", "Orégano"] },
      { id: "sp-c2", titulo: "Pão integral + ovo + suco de laranja natural", descricao: "Pão integral tostado, ovo poché e laranja espremida na hora.", ingredientes: ["Pão integral", "Ovos", "Laranja", "Azeite de oliva"] },
      { id: "sp-c3", titulo: "Iogurte natural + banana + aveia", descricao: "Iogurte sem açúcar, banana em rodelas e aveia em flocos.", ingredientes: ["Iogurte natural", "Banana", "Aveia em flocos", "Canela"] },
    ],
    almoco: [
      { id: "sp-a1", titulo: "Arroz + feijão + frango grelhado + salada", descricao: "Clássico paulista com folhas verdes, tomate e cenoura ralada.", ingredientes: ["Arroz", "Feijão carioca", "Peito de frango", "Alface", "Tomate", "Cenoura", "Azeite"] },
      { id: "sp-a2", titulo: "Arroz integral + lentilha + peixe assado + abobrinha", descricao: "Tilápia assada no forno com ervas e abobrinha refogada.", ingredientes: ["Arroz integral", "Lentilha", "Tilápia", "Abobrinha", "Limão", "Alecrim"] },
      { id: "sp-a3", titulo: "Escondidinho de frango com mandioca", descricao: "Purê de mandioca cobrindo frango desfiado refogado.", ingredientes: ["Mandioca", "Peito de frango", "Cebola", "Alho", "Salsinha"] },
    ],
    tarde: [
      { id: "sp-t1", titulo: "Banana com pasta de amendoim + chá de gengibre", descricao: "Banana cortada com pasta de amendoim 100% e chá quente.", ingredientes: ["Banana", "Pasta de amendoim integral", "Gengibre fresco"] },
      { id: "sp-t2", titulo: "Maçã com castanhas", descricao: "Uma maçã média com um punhado de castanhas do Pará.", ingredientes: ["Maçã", "Castanha do Pará"] },
      { id: "sp-t3", titulo: "Ovo cozido + fatia de mamão", descricao: "Um ovo cozido temperado com sal e fatia de mamão.", ingredientes: ["Ovos", "Mamão papaia"] },
    ],
    jantar: [
      { id: "sp-j1", titulo: "Sopa de legumes com frango desfiado", descricao: "Abóbora, cenoura, chuchu e frango desfiado.", ingredientes: ["Abóbora", "Cenoura", "Chuchu", "Peito de frango", "Cebola", "Alho"] },
      { id: "sp-j2", titulo: "Omelete de claras + salada de folhas", descricao: "Omelete leve com folhas verdes e azeite.", ingredientes: ["Ovos", "Alface", "Rúcula", "Tomate", "Azeite"] },
      { id: "sp-j3", titulo: "Peixe grelhado + purê de abóbora", descricao: "Filé de tilápia grelhado com purê de abóbora temperado.", ingredientes: ["Tilápia", "Abóbora", "Alho", "Azeite"] },
    ],
  },
  sc: {
    cafe: [
      { id: "sc-c1", titulo: "Cuca de banana caseira + café", descricao: "Fatia pequena de cuca integral com café sem açúcar.", ingredientes: ["Farinha integral", "Banana", "Ovos", "Canela", "Café"] },
      { id: "sc-c2", titulo: "Pão integral + ovo + banana", descricao: "Pão integral tostado, ovo mexido e banana em rodelas.", ingredientes: ["Pão integral", "Ovos", "Banana"] },
      { id: "sc-c3", titulo: "Iogurte natural + granola sem açúcar + morango", descricao: "Iogurte natural, granola caseira e morangos frescos.", ingredientes: ["Iogurte natural", "Granola sem açúcar", "Morango"] },
    ],
    almoco: [
      { id: "sc-a1", titulo: "Arroz + feijão preto + frango + repolho refogado", descricao: "Feijão preto ao estilo catarinense com repolho refogado.", ingredientes: ["Arroz", "Feijão preto", "Peito de frango", "Repolho", "Cebola"] },
      { id: "sc-a2", titulo: "Peixe (tainha ou tilápia) assado + arroz + salada", descricao: "Peixe assado com limão, arroz branco e salada mista.", ingredientes: ["Tainha ou tilápia", "Arroz", "Alface", "Tomate", "Limão"] },
      { id: "sc-a3", titulo: "Polenta cremosa + frango ensopado + salada", descricao: "Polenta mole com frango em cubos ensopado.", ingredientes: ["Fubá", "Peito de frango", "Tomate", "Cebola", "Alface"] },
    ],
    tarde: [
      { id: "sc-t1", titulo: "Banana com aveia e canela + chá de camomila", descricao: "Banana amassada com aveia e canela.", ingredientes: ["Banana", "Aveia em flocos", "Canela", "Camomila"] },
      { id: "sc-t2", titulo: "Maçã assada com canela", descricao: "Maçã assada no micro-ondas com canela.", ingredientes: ["Maçã", "Canela"] },
      { id: "sc-t3", titulo: "Iogurte natural com morango", descricao: "Iogurte natural com morangos picados.", ingredientes: ["Iogurte natural", "Morango"] },
    ],
    jantar: [
      { id: "sc-j1", titulo: "Sopa de abóbora com frango", descricao: "Sopa cremosa de abóbora batida com frango desfiado.", ingredientes: ["Abóbora", "Peito de frango", "Cebola", "Alho"] },
      { id: "sc-j2", titulo: "Omelete + salada de folhas", descricao: "Omelete simples com salada verde.", ingredientes: ["Ovos", "Alface", "Tomate", "Azeite"] },
      { id: "sc-j3", titulo: "Peixe grelhado + legumes no vapor", descricao: "Filé de peixe grelhado com brócolis e cenoura no vapor.", ingredientes: ["Tilápia", "Brócolis", "Cenoura", "Limão"] },
    ],
  },
  norte: {
    cafe: [
      { id: "n-c1", titulo: "Tapioca com ovo + açaí puro", descricao: "Tapioca com ovo e uma tigela pequena de açaí puro sem xarope.", ingredientes: ["Goma de tapioca", "Ovos", "Açaí puro"] },
      { id: "n-c2", titulo: "Cuscuz de milho + ovo + banana", descricao: "Cuscuz simples com ovo mexido e banana.", ingredientes: ["Flocão de milho", "Ovos", "Banana"] },
      { id: "n-c3", titulo: "Mingau de tapioca com leite de coco + mamão", descricao: "Mingau leve de tapioca com leite de coco natural.", ingredientes: ["Tapioca granulada", "Leite de coco", "Mamão"] },
    ],
    almoco: [
      { id: "n-a1", titulo: "Arroz + feijão + peixe grelhado + farofa de banana", descricao: "Tucunaré ou tambaqui grelhado com farofa de banana.", ingredientes: ["Arroz", "Feijão", "Peixe de rio", "Banana da terra", "Farinha de mandioca"] },
      { id: "n-a2", titulo: "Arroz + feijão + frango + jambu refogado", descricao: "Frango grelhado com jambu refogado no alho.", ingredientes: ["Arroz", "Feijão", "Peito de frango", "Jambu", "Alho"] },
      { id: "n-a3", titulo: "Peixe cozido + macaxeira + salada", descricao: "Peixe cozido com macaxeira e salada de folhas.", ingredientes: ["Peixe de rio", "Macaxeira", "Alface", "Tomate", "Limão"] },
    ],
    tarde: [
      { id: "n-t1", titulo: "Banana da terra assada + castanha do Pará", descricao: "Banana da terra assada com castanhas.", ingredientes: ["Banana da terra", "Castanha do Pará"] },
      { id: "n-t2", titulo: "Mamão + castanhas", descricao: "Mamão em cubos com castanhas do Pará.", ingredientes: ["Mamão", "Castanha do Pará"] },
      { id: "n-t3", titulo: "Água de coco + tapioca simples", descricao: "Água de coco natural e tapioca simples com pitada de sal.", ingredientes: ["Água de coco", "Goma de tapioca"] },
    ],
    jantar: [
      { id: "n-j1", titulo: "Sopa de peixe leve", descricao: "Caldo leve de peixe com legumes.", ingredientes: ["Peixe de rio", "Cebola", "Tomate", "Coentro"] },
      { id: "n-j2", titulo: "Omelete + salada", descricao: "Omelete com salada de folhas.", ingredientes: ["Ovos", "Alface", "Tomate", "Azeite"] },
      { id: "n-j3", titulo: "Peixe grelhado + purê de macaxeira", descricao: "Peixe grelhado com purê leve de macaxeira.", ingredientes: ["Peixe", "Macaxeira", "Azeite"] },
    ],
  },
  outra: {
    cafe: [
      { id: "o-c1", titulo: "Tapioca com ovo e fruta", descricao: "Tapioca com ovo e a fruta da estação.", ingredientes: ["Goma de tapioca", "Ovos", "Fruta"] },
      { id: "o-c2", titulo: "Pão integral + ovo + fruta", descricao: "Pão integral, ovo mexido e uma fruta.", ingredientes: ["Pão integral", "Ovos", "Fruta"] },
      { id: "o-c3", titulo: "Iogurte natural + aveia + fruta", descricao: "Iogurte natural com aveia e fruta picada.", ingredientes: ["Iogurte natural", "Aveia em flocos", "Fruta"] },
    ],
    almoco: [
      { id: "o-a1", titulo: "Arroz + feijão + frango + salada", descricao: "Combinação clássica com folhas verdes.", ingredientes: ["Arroz", "Feijão", "Peito de frango", "Alface", "Tomate", "Cenoura"] },
      { id: "o-a2", titulo: "Arroz integral + lentilha + peixe + legumes", descricao: "Peixe assado com legumes refogados.", ingredientes: ["Arroz integral", "Lentilha", "Tilápia", "Abobrinha", "Cenoura"] },
      { id: "o-a3", titulo: "Escondidinho de frango com batata-doce", descricao: "Purê de batata-doce sobre frango desfiado.", ingredientes: ["Batata-doce", "Peito de frango", "Cebola", "Alho"] },
    ],
    tarde: [
      { id: "o-t1", titulo: "Fruta + castanhas", descricao: "Uma fruta e um punhado de castanhas.", ingredientes: ["Fruta", "Castanha do Pará"] },
      { id: "o-t2", titulo: "Iogurte + aveia", descricao: "Iogurte natural com aveia.", ingredientes: ["Iogurte natural", "Aveia em flocos"] },
      { id: "o-t3", titulo: "Ovo cozido + fruta", descricao: "Ovo cozido temperado e uma fruta.", ingredientes: ["Ovos", "Fruta"] },
    ],
    jantar: [
      { id: "o-j1", titulo: "Sopa de legumes com frango", descricao: "Sopa leve com frango desfiado.", ingredientes: ["Abóbora", "Cenoura", "Chuchu", "Peito de frango"] },
      { id: "o-j2", titulo: "Omelete + salada", descricao: "Omelete simples com salada.", ingredientes: ["Ovos", "Alface", "Tomate"] },
      { id: "o-j3", titulo: "Peixe grelhado + legumes no vapor", descricao: "Peixe grelhado com brócolis e cenoura.", ingredientes: ["Tilápia", "Brócolis", "Cenoura"] },
    ],
  },
};

// Chá / shot indicado — sempre com contraindicação
export const CHA_INDICADO = {
  nome: "Chá de gengibre morno",
  como: "1 rodela fina de gengibre fresco em 200 ml de água quente, uma vez ao dia, pela manhã ou início da tarde.",
  contraindicacao:
    "Evitar em gestantes, quem usa anticoagulante, tem gastrite, refluxo ou pressão alta descontrolada. Em dúvida, confirme com a Dra. Gabriela.",
};

// Alimentos-base bons pra ter em casa, ajustados à restrição
export function despensaBase(restricao: Restricao): string[] {
  const base = [
    "Ovos",
    "Frango (peito ou coxa sem pele)",
    "Peixe (tilápia ou sardinha)",
    "Feijão",
    "Arroz",
    "Batata-doce",
    "Legumes (abobrinha, cenoura, chuchu, brócolis)",
    "Folhas verdes (alface, rúcula, couve)",
    "Frutas (banana, mamão, maçã, laranja)",
    "Azeite de oliva",
    "Gengibre fresco",
    "Alho e cebola",
    "Água de coco",
  ];
  if (restricao === "sem_lactose" || restricao === "ambas") {
    base.push("Iogurte sem lactose (opcional)");
  } else {
    base.push("Iogurte natural");
  }
  if (restricao === "sem_gluten" || restricao === "ambas") {
    base.push("Tapioca / farinha de mandioca (sem glúten)");
  } else {
    base.push("Pão integral");
    base.push("Aveia em flocos");
  }
  return base;
}

export function listaDeCompras(
  refeicaoIngredientes: string[],
  restricao: Restricao,
): string[] {
  const set = new Set<string>();
  refeicaoIngredientes.forEach((i) => set.add(i));
  despensaBase(restricao).forEach((i) => set.add(i));
  set.add("Gengibre fresco (para o chá)");
  return Array.from(set);
}
