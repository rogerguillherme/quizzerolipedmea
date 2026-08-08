// Lightweight funnel analytics + demo lead store, backed by localStorage.
// Ready to be swapped for a real backend endpoint — the shape of track()
// mirrors what the backend event would carry (name, ts, phone, meta).

const EVENTS_KEY = "zl:events";
const LEADS_KEY = "zl:leads";
const ESCALATIONS_KEY = "zl:escalations";
const NOTIF_KEY = "zl:notif";
const REFUND_KEY = "zl:refunds";

const isBrowser = typeof window !== "undefined";

export type FunnelEvent =
  | "landing_view"
  | "quiz_started"
  | "quiz_step"
  | "quiz_completed"
  | "vsl_progress"
  | "checkout_view"
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


