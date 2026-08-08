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
}

/**
 * Fonte única dos entregáveis do Plano Premium Zero Lipedema (R$67 · 30 dias).
 *
 * A ordem importa: a Rotina e o registro por foto são o destaque da oferta,
 * os guias vêm depois. Qualquer alteração aqui se propaga para a página de
 * oferta (`OfertaPremiumInline`), para a aba Premium do app (`/app/derma`)
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
      "Uma refeição nova por semana. Em 4 semanas suas 4 refeições principais estão ajustadas, sem contar caloria e sem passar fome.",
  },
  {
    id: "foto",
    icone: Camera,
    titulo: "Registro de Refeições com Fotos",
    descricao:
      "Fotografe o prato e receba na hora a leitura: o que ajuda, o que atrapalha e o que ajustar na próxima refeição.",
  },
  {
    id: "dicas",
    icone: Lightbulb,
    titulo: "Dicas diárias no WhatsApp",
    descricao:
      "Orientação prática todo dia, acompanhando a missão da sua semana na Rotina.",
  },
  {
    id: "plano",
    icone: UtensilsCrossed,
    titulo: "Plano alimentar anti-inflamatório",
    descricao:
      "Café, almoço, lanche e jantar dentro do padrão sem glúten e sem lactose.",
  },
  {
    id: "natural",
    icone: Leaf,
    titulo: "Guia Natural Zero Lipedema",
    descricao:
      "Chás e shots caseiros, com preparo, horário e quem não deve tomar.",
  },
  {
    id: "desinchando",
    icone: Droplets,
    titulo: "Guia Desinchando na Prática",
    descricao:
      "Hábitos simples do dia a dia que ajudam a reduzir o inchaço nas pernas.",
  },
  {
    id: "evolucao",
    icone: ClipboardList,
    titulo: "Quadro de Evolução",
    descricao:
      "Seu progresso registrado semana a semana, com os feedbacks da sua rotina.",
  },
] as const;
