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

        // Diagnóstico: registra TODA chamada recebida, mesmo as ignoradas.
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        try {
          await supabaseAdmin.from("app_settings").upsert(
            {
              app_key: "mapa",
              setting_key: "evolution_webhook_ultimo_hit",
              value: { em: new Date().toISOString(), event } as never,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "app_key,setting_key" },
          );
        } catch {
          /* diagnóstico não pode derrubar o webhook */
        }

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

        const msg = (data?.message ?? null) as Record<string, unknown> | null;
        const conteudoTexto =
          (data?.message?.conversation as string | undefined) ??
          (data?.message?.extendedTextMessage?.text as string | undefined) ??
          "";
        const imageMessage = data?.message?.imageMessage as
          | { caption?: string; mimetype?: string }
          | undefined;
        const isImage = Boolean(imageMessage);

        // Rótulo legível para mensagens sem texto (áudio, vídeo, doc...).
        function rotuloMidia(m: Record<string, unknown>): string {
          if (m.imageMessage) return "[imagem]";
          if (m.audioMessage || m.pttMessage) return "[áudio]";
          if (m.videoMessage) return "[vídeo]";
          if (m.documentMessage || m.documentWithCaptionMessage)
            return "[documento]";
          if (m.stickerMessage) return "[figurinha]";
          if (m.locationMessage || m.liveLocationMessage)
            return "[localização]";
          if (m.contactMessage || m.contactsArrayMessage) return "[contato]";
          return "[mensagem]";
        }

        // Só descarta quando não há mensagem nenhuma no payload.
        if (!conteudoTexto && !msg) {
          return Response.json({ ok: true, noMessage: true });
        }
        const conteudo = conteudoTexto || rotuloMidia(msg ?? {});

        const pushName = (data?.pushName as string | undefined) ?? null;


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

        const { data: msgRow } = await supabaseAdmin
          .from("crm_messages")
          .insert({
            conversation_id: conversationId,
            direcao: fromMe ? "out" : "in",
            autor: fromMe ? "humano" : "lead",
            conteudo,
            status: "recebido",
          })
          .select("id")
          .single();

        // Guarda a mídia recebida (imagem/áudio/vídeo/documento) para que a
        // Gabriela consiga abrir dentro do CRM, e não só ver "[áudio]".
        const m = (msg ?? {}) as Record<string, unknown>;
        const temMidia = Boolean(
          m.imageMessage ||
            m.audioMessage ||
            m.pttMessage ||
            m.videoMessage ||
            m.documentMessage ||
            m.documentWithCaptionMessage ||
            m.stickerMessage,
        );
        if (temMidia && msgRow?.id) {
          try {
            const { downloadEvolutionMediaBase64 } = await import(
              "@/lib/evolution.server"
            );
            const media = await downloadEvolutionMediaBase64(data);
            if (media.ok && media.base64) {
              const mime = media.mimetype ?? "application/octet-stream";
              const ext = mime.includes("ogg")
                ? "ogg"
                : mime.includes("mpeg")
                  ? "mp3"
                  : mime.includes("mp4")
                    ? "mp4"
                    : mime.includes("png")
                      ? "png"
                      : mime.includes("webp")
                        ? "webp"
                        : mime.includes("pdf")
                          ? "pdf"
                          : "jpg";
              const bin = Uint8Array.from(atob(media.base64), (ch) =>
                ch.charCodeAt(0),
              );
              const path = `${conversationId}/${msgRow.id}.${ext}`;
              const up = await supabaseAdmin.storage
                .from("crm-midia")
                .upload(path, bin, { contentType: mime, upsert: true });
              if (!up.error) {
                await supabaseAdmin
                  .from("crm_messages")
                  .update({ midia_path: path, midia_tipo: mime })
                  .eq("id", msgRow.id);
              }
            }
          } catch {
            /* mídia nunca pode derrubar o webhook */
          }
        }


        // -------- Entrega pelo WhatsApp --------
        // Cliente paga (plano_ativo): análise de refeição ILIMITADA e cada
        // resposta dela conta como dia cumprido da Rotina.
        // Lead que não comprou: mantém o teste de 3 fotos e a chamada do plano.
        if (!fromMe) {
          const { data: lead } = await supabaseAdmin
            .from("leads")
            .select("id, nome, telefone, status, respostas, user_id")
            .eq("telefone", telefone)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const statusPago = new Set(["plano_ativo", "premium", "cliente"]);
          const pago = Boolean(lead && statusPago.has(String(lead.status)));

          // Check-in por resposta: sem app, o progresso vem da conversa.
          if (pago && lead?.user_id) {
            try {
              const { hojeISO } = await import("@/lib/data-local");
              const hoje = hojeISO();
              const { data: jaTem } = await supabaseAdmin
                .from("rotina_checkins")
                .select("id")
                .eq("user_id", lead.user_id)
                .eq("data", hoje)
                .maybeSingle();
              if (!jaTem) {
                const { data: prog } = await supabaseAdmin
                  .from("rotina_progresso")
                  .select("semana_atual")
                  .eq("user_id", lead.user_id)
                  .maybeSingle();
                await supabaseAdmin.from("rotina_checkins").insert({
                  user_id: lead.user_id,
                  semana: Math.min(4, Math.max(1, Number(prog?.semana_atual ?? 1))),
                  data: hoje,
                  observacao: "resposta no WhatsApp",
                });
              }
            } catch {
              /* check-in nunca pode derrubar o webhook */
            }
          }

          if (isImage && lead) {
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

            if (!pago && usadas >= 3) {
              const msg = `${primeiroNome ? `Oi ${primeiroNome}` : "Oi"} 💛 Seu *teste grátis de 3 fotos* já foi usado.\n\nPra continuar recebendo a leitura de todas as suas refeições, junto com as 4 fases da Rotina e o resumo semanal, tudo aqui no WhatsApp, por *R$67* sem assinatura, é só me responder aqui que eu te passo os próximos passos.`;
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
                    pago,
                  );
                  const wa = await sendWhatsApp(telefone, msg);
                  await supabaseAdmin.from("whatsapp_logs").insert({
                    telefone,
                    mensagem: msg,
                    status: wa.ok ? "enviado" : "falhou",
                    erro: wa.error ?? null,
                  });
                  if (contaComoUsada) {
                    // Cliente paga não tem contador de teste, só o histórico.
                    respostas.teste_fotos = {
                      usadas: pago ? usadas : proximoN,
                      ultima_em: new Date().toISOString(),
                      total: Number(
                        (teste as { total?: number }).total ?? usadas,
                      ) + 1,
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
            return Response.json({ ok: true, foto: true, pago });
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
