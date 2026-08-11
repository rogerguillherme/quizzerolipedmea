// Funnel analytics: grava no localStorage (usado por telas do admin) E envia
// para o banco, que é a única fonte capaz de atribuir lead/venda a anúncio.

import {
  enviarBeacon,
  getAtribuicao,
  getSessionId,
  normalizePath,
} from "./atribuicao";

const EVENTS_KEY = "zl:events";
const LEADS_KEY = "zl:leads";
const ESCALATIONS_KEY = "zl:escalations";
const NOTIF_KEY = "zl:notif";
const REFUND_KEY = "zl:refunds";

const isBrowser = typeof window !== "undefined";

// leadId corrente da sessão, para amarrar os eventos do funil ao lead.
let leadIdAtual: string | null = null;

export function setTrackLeadId(leadId: string | null) {
  leadIdAtual = leadId;
  if (!isBrowser || !leadId) return;
  try {
    localStorage.setItem("zl:lead_id", leadId);
  } catch {
    /* ignore */
  }
}

export function getTrackLeadId(): string | null {
  if (leadIdAtual) return leadIdAtual;
  if (!isBrowser) return null;
  try {
    return localStorage.getItem("zl:lead_id");
  } catch {
    return null;
  }
}


export type FunnelEvent =
  | "landing_view"
  | "quiz_started"
  | "quiz_step"
  | "quiz_completed"
  | "mapa_popup_aberto"
  | "mapa_popup_acessar"
  | "whatsapp_capturado"
  | "vsl_progress"
  | "checkout_view"
  | "checkout_click"
  | "checkout_error"
  | "bump_activated"
  | "purchase_completed"
  | "day_completed"
  | "challenge_completed"
  | "derma_upgrade_clicked"
  | "derma_cta_click"
  | "premium_upgrade_clicked"
  | "premium_meal_demo_opened"
  | "protocol7_started"
  | "protocol7_completed"
  | "rotina_checkin"
  | "rotina_avancou_semana"
  | "rotina_bloqueada_cta"
  | "rotina_concluida_upsell"
  | "refund_requested";

export type TrackedEvent = {
  name: FunnelEvent;
  ts: number;
  phone?: string;
  nome?: string;
  meta?: Record<string, unknown>;
};

export function track(name: FunnelEvent, meta?: Record<string, unknown>) {
  if (!isBrowser) return;
  try {
    const events: TrackedEvent[] = JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
    const app = JSON.parse(localStorage.getItem("zl:app") || "{}");
    events.push({
      name,
      ts: Date.now(),
      phone: app.telefone,
      nome: app.nome,
      meta,
    });
    // Cap to last 500 to avoid runaway localStorage growth.
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-500)));
  } catch {
    /* ignore */
  }

  // Envio para o banco: nunca bloqueia a navegação, nunca estoura na tela.
  try {
    const atribuicao = getAtribuicao();
    enviarBeacon("/api/public/track/event", {
      nome: name,
      path: normalizePath(),
      session_id: getSessionId(),
      lead_id: getTrackLeadId(),
      meta: meta ?? {},
      utm_source: atribuicao.utm_source ?? null,
      utm_medium: atribuicao.utm_medium ?? null,
      utm_campaign: atribuicao.utm_campaign ?? null,
      utm_content: atribuicao.utm_content ?? null,
      utm_term: atribuicao.utm_term ?? null,
      fbclid: atribuicao.fbclid ?? null,
      atribuicao,
    });
  } catch {
    /* ignore */
  }
}


export function getEvents(): TrackedEvent[] {
  if (!isBrowser) return [];
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

// --- Leads (for admin panel) ------------------------------------------------

export type LeadStatus =
  | "mapa_iniciado"
  | "mapa_completo"
  | "checkout"
  | "desafio_ativo"
  | "desafio_parado"
  | "desafio_completo"
  | "reembolso"
  | "metodo_derma";

export type Lead = {
  id: string;
  nome: string;
  telefone: string;
  status: LeadStatus;
  diaDesafio?: number;
  bump?: boolean;
  ultimaAtividade: number;
  createdAt: number;
};

export function getLeads(): Lead[] {
  if (!isBrowser) return [];
  try {
    return JSON.parse(localStorage.getItem(LEADS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function upsertLead(patch: Partial<Lead> & { telefone: string }) {
  if (!isBrowser) return;
  const leads = getLeads();
  const i = leads.findIndex((l) => l.telefone === patch.telefone);
  if (i >= 0) {
    leads[i] = { ...leads[i], ...patch, ultimaAtividade: Date.now() };
  } else {
    leads.push({
      id: crypto.randomUUID(),
      nome: patch.nome || "Sem nome",
      telefone: patch.telefone,
      status: patch.status || "mapa_iniciado",
      diaDesafio: patch.diaDesafio,
      bump: patch.bump,
      ultimaAtividade: Date.now(),
      createdAt: Date.now(),
    });
  }
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

// --- Escalation queue -------------------------------------------------------

export type Escalation = {
  id: string;
  leadNome: string;
  leadTelefone: string;
  pergunta: string;
  createdAt: number;
  respondido?: boolean;
  resposta?: string;
};

export function getEscalations(): Escalation[] {
  if (!isBrowser) return [];
  try {
    return JSON.parse(localStorage.getItem(ESCALATIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveEscalations(list: Escalation[]) {
  if (!isBrowser) return;
  localStorage.setItem(ESCALATIONS_KEY, JSON.stringify(list));
}

// --- Notification prefs -----------------------------------------------------

export type NotifPrefs = {
  lembreteMissao?: boolean;
  liberouDerma?: boolean;
  reagendamento?: boolean;
  modo?: "distribuido" | "resumo";
};

export function getNotifPrefs(): NotifPrefs {
  if (!isBrowser) return {};
  try {
    return JSON.parse(localStorage.getItem(NOTIF_KEY) || "{}");
  } catch {
    return {};
  }
}

export function setNotifPrefs(patch: Partial<NotifPrefs>) {
  if (!isBrowser) return;
  const next = { ...getNotifPrefs(), ...patch };
  localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
}

// --- Refund tracking --------------------------------------------------------

export type RefundRequest = {
  id: string;
  nome: string;
  telefone: string;
  motivo: string;
  diasCompletos: number;
  status: "aprovado" | "em_revisao";
  createdAt: number;
};

export function getRefunds(): RefundRequest[] {
  if (!isBrowser) return [];
  try {
    return JSON.parse(localStorage.getItem(REFUND_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addRefund(r: RefundRequest) {
  if (!isBrowser) return;
  const list = getRefunds();
  list.push(r);
  localStorage.setItem(REFUND_KEY, JSON.stringify(list));
}


