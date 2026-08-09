// Webhook público da Kiwify.
// Configuração no painel Kiwify → Apps → Webhooks:
//   URL: https://<seu-dominio>/api/public/webhooks/kiwify
//   Ao salvar, Kiwify gera um "Token" (assinatura). Copie e salve como KIWIFY_WEBHOOK_TOKEN.
// Kiwify envia a assinatura como query param: ?signature=<hmac_sha1_hex(rawBody, token)>
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { sendCapiEvent } from "@/lib/meta-capi.server";

type KiwifyPayload = {
  order_id?: string;
  order_status?: string; // "paid" | "refunded" | "chargedback" | ...
  webhook_event_type?: string; // "order_approved" | "order_refunded" | ...
  Customer?: {
    email?: string;
    first_name?: string;
    full_name?: string;
    mobile?: string;
    CPF?: string;
  };
  Commissions?: {
    charge_amount?: number; // em centavos
    currency?: string;
    product_base_price?: number;
  };
  TrackingParameters?: {
    src?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
  Product?: { product_id?: string; product_name?: string };
};

function verifyKiwifySignature(rawBody: string, signature: string | null, token: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha1", token).update(rawBody).digest("hex");
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/webhooks/kiwify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.KIWIFY_WEBHOOK_TOKEN;
        if (!token) {
          console.error("[kiwify] KIWIFY_WEBHOOK_TOKEN não configurado");
          return new Response("misconfigured", { status: 500 });
        }

        const url = new URL(request.url);
        const signature = url.searchParams.get("signature");
        const rawBody = await request.text();

        if (!verifyKiwifySignature(rawBody, signature, token)) {
          console.warn("[kiwify] assinatura inválida");
          return new Response("invalid signature", { status: 401 });
        }

        let payload: KiwifyPayload;
        try {
          payload = JSON.parse(rawBody) as KiwifyPayload;
        } catch {
          return new Response("bad json", { status: 400 });
        }

        const eventType = String(payload.webhook_event_type ?? payload.order_status ?? "").toLowerCase();
        const orderId = payload.order_id;
        const isApproved =
          eventType === "order_approved" ||
          eventType === "paid" ||
          payload.order_status === "paid";

        if (!isApproved) {
          console.log("[kiwify] evento ignorado:", eventType, orderId);
          return Response.json({ ok: true, ignored: eventType });
        }

        // Kiwify usa centavos em charge_amount.
        const amountCents = Number(payload.Commissions?.charge_amount ?? 0);
        const value = amountCents > 0 ? amountCents / 100 : undefined;
        const currency = payload.Commissions?.currency ?? "BRL";

        const customer = payload.Customer ?? {};
        const [firstName, ...rest] = String(customer.full_name ?? customer.first_name ?? "")
          .trim()
          .split(/\s+/);
        const lastName = rest.join(" ") || undefined;

        const result = await sendCapiEvent({
          eventName: "Purchase",
          // eventId estável: reentrega do webhook não duplica o Purchase.
          eventId: orderId ? `purchase-${orderId}` : undefined,
          actionSource: "website",
          user: {
            email: customer.email,
            phone: customer.mobile,
            firstName,
            lastName,
            externalId: customer.CPF ?? customer.email ?? orderId,
          },
          customData: {
            value,
            currency,
            order_id: orderId,
            content_ids: payload.Product?.product_id ? [payload.Product.product_id] : undefined,
            content_name: payload.Product?.product_name,
            content_type: "product",
          },
        });

        if (!result.ok) {
          console.error("[kiwify] CAPI falhou", result.status, result.body);
          // 200 mesmo assim para a Kiwify não reentregar em loop; logs ficam para investigação.
        } else {
          console.log("[kiwify] Purchase enviado ao CAPI", orderId, value, currency);
        }

        // -------- Boas-vindas Premium no WhatsApp --------
        // Localiza a lead pelo telefone/email e dispara a mensagem de acesso.
        let welcome: { sent: boolean; error?: string } = { sent: false };
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { normalizePhoneBR } = await import("@/lib/phone");
          const telefone = normalizePhoneBR(customer.mobile ?? "");

          const emailCompra = (customer.email ?? "").trim().toLowerCase() || null;
          let leadId: string | null = null;

          if (telefone) {
            const { data } = await supabaseAdmin
              .from("leads")
              .select("id")
              .eq("telefone", telefone)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            leadId = data?.id ?? null;
          }

          // A lead pode ter digitado outro telefone no checkout: tenta pelo e-mail.
          if (!leadId && emailCompra) {
            const { data } = await supabaseAdmin
              .from("leads")
              .select("id")
              .eq("email", emailCompra)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            leadId = data?.id ?? null;
          }

          // Nenhuma compra pode ficar sem acesso: cria a lead com os dados da Kiwify.
          if (!leadId) {
            const nomeCompra =
              String(customer.full_name ?? customer.first_name ?? "").trim() || "Cliente";
            const { data: novaLead, error: novaErr } = await supabaseAdmin
              .from("leads")
              .insert({
                nome: nomeCompra,
                telefone: telefone || `kiwify-${orderId ?? Date.now()}`,
                email: emailCompra,
                origem: "compra_direta",
                status: "plano_ativo",
              })
              .select("id")
              .single();
            if (novaErr) throw novaErr;
            leadId = novaLead.id;
            console.log("[kiwify] lead criada a partir da compra", leadId, orderId);
          }

          // Venda atribuída: reaproveita a atribuição de primeiro toque já
          // gravada em leads.respostas.atribuicao (o update de status não a apaga).
          try {
            const { data: leadAtual } = await supabaseAdmin
              .from("leads")
              .select("respostas")
              .eq("id", leadId)
              .maybeSingle();
            const atrib = ((leadAtual?.respostas as Record<string, unknown> | null)
              ?.atribuicao ?? {}) as Record<string, string | null>;
            await supabaseAdmin.from("eventos").insert({
              nome: "purchase_completed",
              lead_id: leadId,
              path: "/webhook/kiwify",
              meta: { order_id: orderId, valor: value ?? null, origem: "kiwify" } as never,
              utm_source: atrib.utm_source ?? null,
              utm_medium: atrib.utm_medium ?? null,
              utm_campaign: atrib.utm_campaign ?? null,
              utm_content: atrib.utm_content ?? null,
              utm_term: atrib.utm_term ?? null,
              fbclid: atrib.fbclid ?? null,
            });
          } catch (e) {
            console.error("[kiwify] falha ao registrar evento de compra", e);
          }

          const { enviarPremiumParaLead } = await import(
            "@/lib/premium-access.functions"
          );
          const r = await enviarPremiumParaLead(leadId);
          welcome = { sent: r.ok, error: r.erro ?? undefined };
        } catch (e) {
          welcome = { sent: false, error: (e as Error).message };
          console.error("[kiwify] falha ao enviar boas-vindas premium", e);
        }

        return Response.json({
          ok: true,
          order_id: orderId,
          capi: result.ok,
          premium_welcome: welcome,
        });
      },
    },
  },
});
