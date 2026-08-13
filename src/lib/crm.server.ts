/**
 * Helpers server-only do CRM.
 *
 * Aqui mora a lógica pesada (vínculo conversa ↔ lead e cálculo de etapa do
 * funil) para que `crm.functions.ts` continue sendo apenas um wrapper fino de
 * server functions — exigência do code splitting do TanStack Start.
 */
import { chaveTelefone, temIntencaoCompra } from "./cadencia-estado";

export type Etapa =
  | "mapa_feito"
  | "em_conversa"
  | "quer_saber_mais"
  | "cliente"
  | "sem_resposta";

export const ETAPAS: Array<{ id: Etapa; label: string }> = [
  { id: "mapa_feito", label: "Mapa feito" },
  { id: "em_conversa", label: "Em conversa" },
  { id: "quer_saber_mais", label: "Quer saber mais" },
  { id: "cliente", label: "Cliente" },
  { id: "sem_resposta", label: "Sem resposta" },
];

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

/** Garante que o chamador é admin; lança se não for. */
export async function assertAdmin(supabase: Any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Acesso restrito.");
}

/** Calcula a etapa a partir do estado do lead e das mensagens da conversa. */
export function calcularEtapa(args: {
  leadStatus?: string | null;
  conversaStatus?: string | null;
  mensagensRecebidas: Array<{ conteudo: string | null }>;
  ultimaMensagemEm?: string | null;
}): Etapa {
  if (args.leadStatus === "plano_ativo") return "cliente";
  if (args.conversaStatus === "invalido") return "sem_resposta";

  const respondeu = args.mensagensRecebidas.length > 0;
  if (args.mensagensRecebidas.some((m) => temIntencaoCompra(m.conteudo)))
    return "quer_saber_mais";

  const ts = args.ultimaMensagemEm ? Date.parse(args.ultimaMensagemEm) : NaN;
  const silencio = Number.isFinite(ts) ? Date.now() - ts > SETE_DIAS_MS : false;
  if (silencio) return "sem_resposta";

  return respondeu ? "em_conversa" : "mapa_feito";
}

/**
 * Casa conversas com leads pelos 8 últimos dígitos do telefone e devolve a
 * lista enriquecida (lead + etapa calculada).
 */
export async function montarConversas(supabase: Any) {
  const { data: convs, error } = await supabase
    .from("crm_conversations")
    .select("*")
    .order("ultima_mensagem_em", { ascending: false, nullsFirst: false })
    .limit(300);
  if (error) throw error;
  const conversas: Any[] = convs ?? [];
  if (conversas.length === 0) return [];

  const { data: leadsData } = await supabase
    .from("leads")
    .select(
      "id, nome, telefone, email, status, origem, created_at, respostas, diagnostico",
    )
    .order("created_at", { ascending: false })
    .limit(2000);

  const porChave = new Map<string, Any>();
  for (const l of (leadsData ?? []) as Any[]) {
    const k = chaveTelefone(l.telefone);
    if (k.length === 8 && !porChave.has(k)) porChave.set(k, l);
  }

  const ids = conversas.map((c) => c.id);
  const { data: msgsIn } = await supabase
    .from("crm_messages")
    .select("conversation_id, conteudo")
    .eq("direcao", "in")
    .in("conversation_id", ids);

  const recebidas = new Map<string, Array<{ conteudo: string | null }>>();
  for (const m of (msgsIn ?? []) as Any[]) {
    const arr = recebidas.get(m.conversation_id) ?? [];
    arr.push({ conteudo: m.conteudo });
    recebidas.set(m.conversation_id, arr);
  }

  return conversas.map((c) => {
    const lead = porChave.get(chaveTelefone(c.telefone)) ?? null;
    const calculada = calcularEtapa({
      leadStatus: lead?.status ?? null,
      conversaStatus: c.status,
      mensagensRecebidas: recebidas.get(c.id) ?? [],
      ultimaMensagemEm: c.ultima_mensagem_em,
    });
    return {
      ...c,
      etapa: c.etapa_manual ? (c.etapa as Etapa) : calculada,
      etapa_calculada: calculada,
      lead,
    };
  });
}
