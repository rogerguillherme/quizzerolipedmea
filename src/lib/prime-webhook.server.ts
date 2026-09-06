// SERVER-ONLY — notifica o Prime Chat (CRM/atendimento da Gabriela no
// WhatsApp) quando uma lead termina o Mapa do Lipedema, mandando o
// diagnóstico completo. Assim a IA de lá já continua a conversa sabendo o
// estágio, os sintomas e o que a lead respondeu, em vez de começar do zero.
//
// A URL já inclui o token do endpoint — formato do Prime:
// https://<projeto>.supabase.co/functions/v1/custom-webhook/<token>
// (endpoint tipo "Lead Capturado (genérico)" criado na tela de Webhooks
// do Prime). Sem essa env configurada, a notificação é só pulada: nunca
// pode quebrar a entrega do Mapa em si.

export async function notifyPrimeChat(payload: {
  nome: string;
  telefone: string;
  metadata: Record<string, unknown>;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const url = process.env.PRIME_WEBHOOK_URL;
  if (!url) return { ok: false, skipped: true, error: "PRIME_WEBHOOK_URL ausente" };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: payload.nome,
        telefone: payload.telefone,
        metadata: payload.metadata,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
