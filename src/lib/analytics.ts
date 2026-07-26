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

// --- Demo seed for admin panel demonstration --------------------------------

export function seedAdminDemoIfEmpty() {
  if (!isBrowser) return;
  if (getLeads().length > 0) return;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const demo: Lead[] = [
    {
      id: crypto.randomUUID(),
      nome: "Amanda C.",
      telefone: "(11) 9 8123-4567",
      status: "desafio_ativo",
      diaDesafio: 4,
      bump: true,
      ultimaAtividade: now - 2 * 60 * 60 * 1000,
      createdAt: now - 4 * day,
    },
    {
      id: crypto.randomUUID(),
      nome: "Beatriz M.",
      telefone: "(21) 9 9876-5432",
      status: "desafio_parado",
      diaDesafio: 2,
      bump: false,
      ultimaAtividade: now - 3 * day,
      createdAt: now - 5 * day,
    },
    {
      id: crypto.randomUUID(),
      nome: "Carolina P.",
      telefone: "(31) 9 7654-3210",
      status: "metodo_derma",
      bump: true,
      ultimaAtividade: now - 6 * 60 * 60 * 1000,
      createdAt: now - 30 * day,
    },
    {
      id: crypto.randomUUID(),
      nome: "Débora L.",
      telefone: "(41) 9 6543-2109",
      status: "mapa_completo",
      ultimaAtividade: now - 1 * day,
      createdAt: now - 2 * day,
    },
    {
      id: crypto.randomUUID(),
      nome: "Elisa R.",
      telefone: "(51) 9 5432-1098",
      status: "reembolso",
      diaDesafio: 3,
      ultimaAtividade: now - 12 * 60 * 60 * 1000,
      createdAt: now - 8 * day,
    },
    {
      id: crypto.randomUUID(),
      nome: "Fernanda S.",
      telefone: "(11) 9 4321-0987",
      status: "desafio_completo",
      diaDesafio: 7,
      bump: false,
      ultimaAtividade: now - 5 * day,
      createdAt: now - 12 * day,
    },
  ];
  localStorage.setItem(LEADS_KEY, JSON.stringify(demo));

  const esc: Escalation[] = [
    {
      id: crypto.randomUUID(),
      leadNome: "Beatriz M.",
      leadTelefone: "(21) 9 9876-5432",
      pergunta:
        "Posso tomar o chá indicado junto com o remédio pra pressão que meu médico passou? Não quero atrapalhar.",
      createdAt: now - 3 * day,
    },
    {
      id: crypto.randomUUID(),
      leadNome: "Amanda C.",
      leadTelefone: "(11) 9 8123-4567",
      pergunta:
        "Meu inchaço piorou muito na TPM, é normal ou tenho que ajustar alguma coisa?",
      createdAt: now - 6 * 60 * 60 * 1000,
    },
    {
      id: crypto.randomUUID(),
      leadNome: "Elisa R.",
      leadTelefone: "(51) 9 5432-1098",
      pergunta: "Pedi reembolso porque a dor não melhorou nos primeiros 3 dias.",
      createdAt: now - 12 * 60 * 60 * 1000,
    },
  ];
  localStorage.setItem(ESCALATIONS_KEY, JSON.stringify(esc));

  // Seed some funnel events for the dashboard chart to show real numbers.
  const events: TrackedEvent[] = [];
  const push = (n: FunnelEvent, count: number) => {
    for (let i = 0; i < count; i++)
      events.push({ name: n, ts: now - Math.random() * 7 * day });
  };
  push("landing_view", 480);
  push("quiz_started", 312);
  push("quiz_completed", 198);
  push("checkout_view", 96);
  push("purchase_completed", 41);
  push("bump_activated", 22);
  push("challenge_completed", 18);
  push("derma_upgrade_clicked", 6);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}
