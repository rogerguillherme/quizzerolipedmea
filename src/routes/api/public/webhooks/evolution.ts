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

        const conteudoTexto =
          (data?.message?.conversation as string | undefined) ??
          (data?.message?.extendedTextMessage?.text as string | undefined) ??
          "";
        const imageMessage = data?.message?.imageMessage as
          | { caption?: string; mimetype?: string }
          | undefined;
        const isImage = Boolean(imageMessage);
        const conteudo = conteudoTexto || (isImage ? "[imagem]" : "");
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

        // -------- Teste grátis de 3 fotos de refeição (pré-plano R$67) --------
        // Se for imagem recebida do lead, tenta rodar o feedback multimodal.
        if (!fromMe && isImage) {
          const { data: lead } = await supabaseAdmin
            .from("leads")
            .select("id, nome, telefone, status, respostas")
            .eq("telefone", telefone)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Só roda para leads já cadastradas e que ainda não pagaram o plano.
          const statusPago = new Set(["plano_ativo", "premium", "cliente"]);
          if (lead && !statusPago.has(String(lead.status))) {
            const respostas =
              (lead.respostas as Record<string, unknown>) ?? {};
            const teste =
              (respostas.teste_fotos as {
                usadas?: number;
                ultima_em?: string;
              }) ?? { usadas: 0 };
            const usadas = Number(teste.usadas ?? 0);
            const primeiroNome = String(lead.nome ?? "").split(" ")[0] || "";

            const { sendWhatsApp } = await import("@/lib/evolution.server");

            if (usadas >= 3) {
              const msg = `${primeiroNome ? `Oi ${primeiroNome}` : "Oi"} 💛 Seu *teste grátis de 3 fotos* já foi usado.\n\nPra continuar recebendo feedback ilimitado das suas refeições + o *plano completo* (sugestão alimentar, chás/shots e lista de compras) por *R$67* — sem assinatura — é só me responder aqui que eu te passo os próximos passos.`;
              const wa = await sendWhatsApp(telefone, msg);
              await supabaseAdmin.from("whatsapp_logs").insert({
                telefone,
                mensagem: msg,
                status: wa.ok ? "enviado" : "falhou",
                erro: wa.error ?? null,
              });
            } else {
              const { downloadEvolutionMediaBase64 } = await import(
                "@/lib/evolution.server"
              );
              const { analisarFotoRefeicao, formatarFeedbackWhatsApp } =
                await import("@/lib/meal-photo.server");

              const media = await downloadEvolutionMediaBase64(data);
              if (!media.ok || !media.base64) {
                const msg = `Oi ${primeiroNome}! Recebi sua foto mas não consegui abrir por aqui 😔 Me manda de novo, por favor?`;
                const wa = await sendWhatsApp(telefone, msg);
                await supabaseAdmin.from("whatsapp_logs").insert({
                  telefone,
                  mensagem: msg,
                  status: wa.ok ? "enviado" : "falhou",
                  erro: media.error ?? wa.error ?? null,
                });
              } else {
                const analise = await analisarFotoRefeicao(
                  media.base64,
                  media.mimetype ?? "image/jpeg",
                );
                if (!analise.ok || !analise.feedback) {
                  const msg = `${primeiroNome}, tive um probleminha pra analisar essa foto agora. Pode me mandar outra em alguns minutos? 🙏`;
                  const wa = await sendWhatsApp(telefone, msg);
                  await supabaseAdmin.from("whatsapp_logs").insert({
                    telefone,
                    mensagem: msg,
                    status: "falhou",
                    erro: analise.error ?? wa.error ?? null,
                  });
                } else {
                  // Só conta como foto usada se a análise reconheceu refeição.
                  const contaComoUsada = analise.feedback.isRefeicao;
                  const proximoN = contaComoUsada ? usadas + 1 : usadas;
                  const msg = formatarFeedbackWhatsApp(
                    analise.feedback,
                    Math.max(1, proximoN),
                    primeiroNome,
                  );
                  const wa = await sendWhatsApp(telefone, msg);
                  await supabaseAdmin.from("whatsapp_logs").insert({
                    telefone,
                    mensagem: msg,
                    status: wa.ok ? "enviado" : "falhou",
                    erro: wa.error ?? null,
                  });
                  if (contaComoUsada) {
                    respostas.teste_fotos = {
                      usadas: proximoN,
                      ultima_em: new Date().toISOString(),
                    };
                    await supabaseAdmin
                      .from("leads")
                      .update({ respostas: respostas as never })
                      .eq("id", lead.id);
                  }
                }
              }
            }

            // Encerra aqui — a imagem não deve cair no parser de feedback textual.
            return Response.json({ ok: true, photoTest: true });
          }
        }


        // Interpretação de feedback do Protocolo 7 Dias.
        // Só entra em ação se a lead tem jornada_7dias.ativa; caso contrário,
        // segue o comportamento normal (mensagem cai no inbox humano).
        if (!fromMe) {
          const norm = conteudo
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .trim();

          let resposta: "sim" | "parcial" | "nao" | null = null;
          if (/\b(sim|consegui|ok|feito|fiz)\b/.test(norm)) resposta = "sim";
          else if (/(mais ou menos|parcial|quase|meio a meio|em partes)/.test(norm))
            resposta = "parcial";
          else if (/\b(nao|não|nao consegui|not?ao)\b/.test(norm) || /^n$/.test(norm))
            resposta = "nao";

          if (resposta) {
            const { data: lead } = await supabaseAdmin
              .from("leads")
              .select("id, respostas")
              .eq("telefone", telefone)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (lead) {
              const respostas =
                (lead.respostas as Record<string, unknown>) ?? {};
              const j =
                (respostas.jornada_7dias as Record<string, unknown>) ?? {};
              if (j.ativa) {
                const feedback =
                  (j.feedback as Record<string, string>) ?? {};
                const dia = Math.max(
                  1,
                  Math.min(7, Number(j.dia_atual ?? 1) - 1 || 1),
                );
                feedback[String(dia)] = resposta;
                j.feedback = feedback;
                j.dia_atual = Math.max(Number(j.dia_atual || 1), dia + 1);
                j.ultimo_feedback_em = new Date().toISOString();
                respostas.jornada_7dias = j;
                await supabaseAdmin
                  .from("leads")
                  .update({ respostas: respostas as never })
                  .eq("id", lead.id);
              }
            }
          }
        }

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
