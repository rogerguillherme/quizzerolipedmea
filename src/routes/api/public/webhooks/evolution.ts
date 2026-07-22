// Webhook público que a Evolution API chama a cada mensagem recebida.
// Cola-se essa URL no painel da instância → Webhook → Events: messages.upsert.
import { createFileRoute } from "@tanstack/react-router";

function normalizePhone(raw: string): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits;
}

export const Route = createFileRoute("/api/public/webhooks/evolution")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return new Response("bad request", { status: 400 });
        }

        // Formato Evolution: { event, data: { key, message, pushName, ... } }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (body?.data ?? {}) as any;
        const event = String(body?.event ?? "");
        if (!event.includes("messages")) {
          return Response.json({ ok: true, ignored: true });
        }

        const remoteJid = data?.key?.remoteJid as string | undefined;
        if (!remoteJid || String(remoteJid).endsWith("@g.us")) {
          // grupos: ignora
          return Response.json({ ok: true, group: true });
        }
        const fromMe = Boolean(data?.key?.fromMe);
        const telefone = normalizePhone(remoteJid.split("@")[0] ?? "");
        if (!telefone) return Response.json({ ok: true, empty: true });

        const conteudo =
          (data?.message?.conversation as string | undefined) ??
          (data?.message?.extendedTextMessage?.text as string | undefined) ??
          "";
        if (!conteudo) return Response.json({ ok: true, noText: true });

        const pushName = (data?.pushName as string | undefined) ?? null;

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        // Upsert conversa por telefone
        const { data: existing } = await supabaseAdmin
          .from("crm_conversations")
          .select("id, nao_lidas")
          .eq("telefone", telefone)
          .maybeSingle();

        let conversationId: string;
        if (existing) {
          conversationId = existing.id;
          await supabaseAdmin
            .from("crm_conversations")
            .update({
              ultima_mensagem: conteudo,
              ultima_mensagem_em: new Date().toISOString(),
              nao_lidas: fromMe ? existing.nao_lidas : (existing.nao_lidas ?? 0) + 1,
            })
            .eq("id", conversationId);
        } else {
          const { data: created, error } = await supabaseAdmin
            .from("crm_conversations")
            .insert({
              telefone,
              nome: pushName,
              app_context: "mapa",
              status: "ativo",
              modo: "ia",
              ultima_mensagem: conteudo,
              ultima_mensagem_em: new Date().toISOString(),
              nao_lidas: fromMe ? 0 : 1,
            })
            .select("id")
            .single();
          if (error || !created) {
            return new Response("db error", { status: 500 });
          }
          conversationId = created.id;
        }

        await supabaseAdmin.from("crm_messages").insert({
          conversation_id: conversationId,
          direcao: fromMe ? "out" : "in",
          autor: fromMe ? "humano" : "lead",
          conteudo,
          status: "recebido",
        });

        return Response.json({ ok: true });
      },
      GET: async () =>
        Response.json({
          service: "Zero Lipedema · Evolution webhook",
          ok: true,
        }),
    },
  },
});
