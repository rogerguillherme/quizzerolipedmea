// SERVER-ONLY — análise de foto de refeição via Lovable AI Gateway (visão multimodal).
// Usado no teste grátis de 3 fotos que a lead recebe pelo WhatsApp antes do plano pago.

const SYSTEM = `Você é a assistente da nutricionista Gabriela Rosado (CRN 10582), especialista em lipedema.
Uma lead está testando o acompanhamento por foto — envie um feedback CURTO, acolhedor e NÃO-prescritivo sobre a refeição da imagem.

Regras invioláveis:
- NUNCA diagnostique, nunca prescreva, nunca dê quantidade em gramas/calorias.
- Se a imagem não for uma refeição/comida, responda gentilmente pedindo uma foto do prato.
- Português do Brasil, 2ª pessoa, tom próximo e direto, sem infantilizar.
- Foco em lipedema: atenção especial a sódio, ultraprocessados, açúcar e hidratação.
- Nunca prometa emagrecimento nem cura.

Devolva APENAS um JSON válido (sem markdown), no formato:
{
  "isRefeicao": true | false,
  "pontos": ["1 ou 2 observações curtas — cada uma até 120 caracteres. Ex: 'boa fonte de proteína magra', 'cuidado com o sódio do tempero'."],
  "sugestao": "1 sugestão prática de até 160 caracteres, acionável na próxima refeição."
}`;

export type MealFeedback = {
  isRefeicao: boolean;
  pontos: string[];
  sugestao: string;
};

export async function analisarFotoRefeicao(
  base64: string,
  mimetype: string,
): Promise<{ ok: boolean; feedback?: MealFeedback; error?: string }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { ok: false, error: "LOVABLE_API_KEY ausente" };

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise essa refeição." },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimetype};base64,${base64}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${t.slice(0, 200)}` };
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<MealFeedback>;
    return {
      ok: true,
      feedback: {
        isRefeicao: Boolean(parsed.isRefeicao),
        pontos: Array.isArray(parsed.pontos)
          ? parsed.pontos.slice(0, 2).map(String)
          : [],
        sugestao: String(parsed.sugestao ?? ""),
      },
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Formata o feedback como texto de WhatsApp. `nfoto` = qual foto do teste (1..3). */
export function formatarFeedbackWhatsApp(
  f: MealFeedback,
  nfoto: number,
  primeiroNome: string,
): string {
  if (!f.isRefeicao) {
    return `Hmm, não consegui ver bem a refeição nessa foto, ${primeiroNome} 🙈 Me manda uma foto do prato de cima, com boa luz, que eu te dou o feedback ✨`;
  }
  const pontos = f.pontos.length
    ? f.pontos.map((p) => `• ${p}`).join("\n")
    : "• Refeição registrada com sucesso.";
  const restantes = 3 - nfoto;
  const rodape =
    restantes > 0
      ? `\n\n_Você ainda tem ${restantes} foto${restantes > 1 ? "s" : ""} no seu teste grátis._`
      : `\n\n💛 Essa foi sua *3ª e última foto do teste grátis*.\nQuer continuar com feedback ilimitado + plano completo (sugestão alimentar, chás/shots e lista de compras) por *R$57*, sem assinatura? Me responde aqui que eu te passo os próximos passos.`;

  return `📸 *Feedback da sua refeição (${nfoto}/3)*\n\n${pontos}\n\n👉 ${f.sugestao}${rodape}`;
}
