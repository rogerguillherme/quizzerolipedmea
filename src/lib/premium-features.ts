import {
  CalendarCheck,
  Camera,
  Lightbulb,
  UtensilsCrossed,
  Leaf,
  Droplets,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export interface PremiumFeature {
  /** Identificador estável, usado para casar com a ilustração do carrossel. */
  id: string;
  /** Ícone lucide-react exibido ao lado do item. */
  icone: LucideIcon;
  titulo: string;
  descricao: string;
  /** Foto real (Storage público) exibida no carrossel de benefícios. */
  foto: string;
  /** Texto alternativo descritivo da foto. */
  fotoAlt: string;
}

const FOTOS_BASE =
  "https://gwvlsnpfwvziejranzyl.supabase.co/storage/v1/object/public/marketing/premium/";


/**
 * Fonte única dos entregáveis do Plano Premium Zero Lipedema (R$67 · 30 dias).
 *
 * A ordem importa: a Rotina e o registro por foto são o destaque da oferta,
 * os guias vêm depois. Qualquer alteração aqui se propaga para a página de
 * oferta (`OfertaPremiumInline`), para a página do plano (`/app/derma`)
 * e para a mensagem de boas-vindas no WhatsApp.
 *
 * Importante: anamnese, leitura de exames e prescrição personalizada NÃO
 * fazem parte deste plano (são exclusivos do plano de R$297).
 */
export const PREMIUM_FEATURES: readonly PremiumFeature[] = [
  {
    id: "rotina",
    icone: CalendarCheck,
    titulo: "Rotina Zero Lipedema",
    descricao:
      "Um plano em 4 fases para moldar os hábitos que alimentam o lipedema. Nada é proibido e nenhuma refeição é pulada. O alvo é reduzir inflamação, dor e inchaço.",
    foto: `${FOTOS_BASE}rotina.jpg`,
    fotoAlt:
      "Prato de ovos mexidos com abacate e frutas vermelhas na luz da manhã",
  },
  {
    id: "foto",
    icone: Camera,
    titulo: "Registro de Refeições com Fotos",
    descricao:
      "Fotografe o prato e receba na hora a leitura: o que ajuda, o que atrapalha e o que ajustar na próxima refeição.",
    foto: `${FOTOS_BASE}foto.jpg`,
    fotoAlt: "Mãos fotografando o prato de comida com o celular",
  },
  {
    id: "dicas",
    icone: Lightbulb,
    titulo: "Dicas diárias no WhatsApp",
    descricao:
      "Orientação prática todo dia, acompanhando a missão da sua semana na Rotina.",
    foto: `${FOTOS_BASE}dicas.jpg`,
    fotoAlt: "Celular com uma conversa aberta ao lado de uma xícara de chá",
  },
  {
    id: "plano",
    icone: UtensilsCrossed,
    titulo: "Plano alimentar anti-inflamatório",
    descricao:
      "Café, almoço, lanche e jantar dentro do padrão sem glúten e sem lactose.",
    foto: `${FOTOS_BASE}plano.jpg`,
    fotoAlt: "Prato de frango grelhado com legumes assados e frutas",
  },
  {
    id: "natural",
    icone: Leaf,
    titulo: "Guia Natural Zero Lipedema",
    descricao:
      "Chás e shots caseiros, com preparo, horário e quem não deve tomar.",
    foto: `${FOTOS_BASE}natural.jpg`,
    fotoAlt: "Chá quente de gengibre com hortelã e mel, com fumaça subindo",
  },
  {
    id: "desinchando",
    icone: Droplets,
    titulo: "Guia Desinchando na Prática",
    descricao:
      "Hábitos simples do dia a dia que ajudam a reduzir o inchaço nas pernas.",
    foto: `${FOTOS_BASE}desinchando.jpg`,
    fotoAlt: "Pernas descansando elevadas sobre uma almofada",
  },
  {
    id: "evolucao",
    icone: ClipboardList,
    titulo: "Quadro de Evolução",
    descricao:
      "Seu progresso registrado semana a semana, com os feedbacks da sua rotina.",
    foto: `${FOTOS_BASE}evolucao.jpg`,
    fotoAlt: "Mão segurando o celular com um gráfico de progresso dourado",
  },
] as const;

