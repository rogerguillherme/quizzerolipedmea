/**
 * Estado da régua de WhatsApp em função do COMPORTAMENTO da lead, não do
 * calendário.
 *
 * Regras (ordem de precedência):
 *   1. número inválido        → sai de tudo
 *   2. comprou (plano_ativo)  → só a cadência pós-compra
 *   3. intenção de compra     → fast-track direto pra oferta
 *   4. respondeu nas últimas 48h → pausa, nada programado
 *   5. silêncio               → régua normal
 *
 * O vínculo entre `leads.telefone` e `crm_conversations.telefone` é feito
 * pelos 8 últimos dígitos: o webhook da Evolution grava `55DDD9XXXXXXXX` e o
 * lead pode ter sido cadastrado com máscara, com ou sem o nono dígito.
 */

/** Janela de silêncio necessária para a régua voltar a rodar. */
export const JANELA_PAUSA_MS = 48 * 60 * 60 * 1000;

/** Chave de casamento entre telefones em formatos diferentes. */
export function chaveTelefone(raw: string | null | undefined): string {
  const d = String(raw ?? "").replace(/\D/g, "");
  return d.slice(-8);
}

/** Gatilhos de intenção de compra (fallback quando o agente não classificou). */
export const TRIGGERS_INTENCAO = [
  "quanto custa",
  "quanto",
  "preço",
  "preco",
  "valor",
  "como funciona",
  "quero",
  "me interessa",
  "onde compro",
  "link",
  "pagar",
  "comprar",
] as const;

/** true quando o texto recebido indica intenção de compra. */
export function temIntencaoCompra(texto: string | null | undefined): boolean {
  if (!texto) return false;
  const t = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return TRIGGERS_INTENCAO.some((g) =>
    t.includes(
      g.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    ),
  );
}

export type EstadoRegua = {
  /** Último passo programado que já saiu. */
  passo: string;
  /** Pausada por resposta recente da lead. */
  pausada: boolean;
  pausadaEm?: string;
  /** Pulou para a oferta por intenção de compra. */
  fastTrack: boolean;
  fastTrackEm?: string;
  /** Número inexistente no WhatsApp: saiu de toda a cadência. */
  invalido: boolean;
  rotulo: string;
};

const ROTULO_PRE: Record<string, string> = {
  pos1h_at: "convite da foto (+20h)",
  pos2h_foto_at: "quebra de objeção (+44h)",
  pos48h_at: "oferta R$67 (+68h)",
  pos6d_at: "última chamada (+6d)",
};

/** Resumo legível da régua de um lead, para a fila de atenção do admin. */
export function descreverRegua(
  respostas: Record<string, unknown> | null | undefined,
  status?: string | null,
): EstadoRegua {
  const r = (respostas ?? {}) as Record<string, unknown>;
  const atencao = r.atencao as { motivo?: string } | undefined;
  const invalido = atencao?.motivo === "numero_invalido";
  const pausadaEm = r.cadencia_pausada_em as string | undefined;
  const fastTrackEm = r.fast_track_em as string | undefined;

  let passo = "nenhum passo enviado";
  if (status === "plano_ativo") {
    const m = (r.rotina_msgs ?? {}) as {
      dias_enviados?: number[];
      conclusao?: string;
      acesso_4h?: string;
    };
    if (m.conclusao) passo = "rotina concluída (28 dias)";
    else if (m.dias_enviados?.length)
      passo = `rotina · dia ${Math.max(...m.dias_enviados)}`;
    else if (m.acesso_4h) passo = "rotina · lembrete de acesso";
    else passo = "rotina · aguardando primeiro toque";
  } else {
    const reengaje = (r.reengaje ?? {}) as Record<string, string>;
    const enviados = Object.keys(reengaje).filter((k) => reengaje[k]);
    if (enviados.length) {
      const ultimo = enviados
        .map((k) => [k, Date.parse(reengaje[k] ?? "") || 0] as const)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      passo = ROTULO_PRE[ultimo ?? ""] ?? (ultimo ?? passo);
    }
  }

  const pausada = Boolean(
    pausadaEm && Date.now() - Date.parse(pausadaEm) < JANELA_PAUSA_MS,
  );

  const rotulo = invalido
    ? "fora da régua · número inválido"
    : pausada
      ? `pausada · respondeu (${passo})`
      : fastTrackEm
        ? `fast-track · intenção de compra (${passo})`
        : passo;

  return {
    passo,
    pausada,
    ...(pausadaEm ? { pausadaEm } : {}),
    fastTrack: Boolean(fastTrackEm),
    ...(fastTrackEm ? { fastTrackEm } : {}),
    invalido,
    rotulo,
  };
}
