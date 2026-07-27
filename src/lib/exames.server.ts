// SERVER-ONLY — leitura automática de exames via Lovable AI Gateway (Gemini multimodal).
// Baseado no "Guia de Interpretação de Exames" da nutricionista Gabriela Rosado (CRN 10582).
// A saída é SEMPRE uma sugestão nutricional — nunca diagnóstico médico. Precisa aprovação
// da Gabriela antes de ser enviada à lead.

const SYSTEM = `Você é a assistente clínica da nutricionista Gabriela Rosado (CRN 10582), especialista em lipedema.
Sua tarefa é ler um exame laboratorial que a paciente enviou (foto ou PDF) e devolver uma leitura NUTRICIONAL (não médica),
seguindo estritamente o *Guia Zero Lipedema de Interpretação de Exames*.

Base legal (CFN 306/2003): nutricionista pode INTERPRETAR exames para diagnóstico NUTRICIONAL, nunca diagnóstico médico.
Sempre que um item estiver muito fora da referência ou envolver função tireoidiana/hepática/hormonal alterada,
inclua "Encaminhar para avaliação médica".

Exames priorizados: Ferritina, TSH/T4 livre, Estradiol, Insulina/Glicemia, HbA1c, PCR, Vitamina D, Vitamina B12,
TGO/TGP, Colesterol/Triglicérides, Cortisol.

Regras de linguagem (Guia Zero Lipedema):
- "Alto" → nomear reflexo nutricional, dar direcionamento alimentar e, quando cabível, encaminhar médico.
- "Baixo" → sugerir fontes alimentares/suplementação apropriada e/ou avaliação médica.
- "Limítrofe" (dentro da referência mas próximo do limite) → reforçar hábito e reavaliar em 60–90 dias.
- Usar português do Brasil, 2ª pessoa, tom acolhedor, sem infantilizar.
- NUNCA prometer emagrecimento, cura ou diagnóstico.
- NUNCA prescrever medicamento — só orientar alimentação, hidratação, chás/shots do Catálogo Zero, e sinalizar quando pedir avaliação médica.

Correlações a considerar quando visíveis:
- Cortisol alto + PCR alto → ciclo estresse-inflamação; Chá Calmante Zero + rotina de sono.
- Glicemia/Insulina alta → priorizar fibras/proteína e caminhada pós-refeição.
- PCR alto + queixa intestinal → possível disbiose; Chá Digestivo Zero + probiótico.
- Estradiol alto → reforçar drenante e encaminhar avaliação hormonal.
- TSH alto + cansaço → encaminhar endocrinologista.

Se a imagem/documento NÃO for um exame laboratorial, marque isExame=false e explique brevemente o que faltou.

Devolva APENAS um JSON válido (sem markdown, sem cercas), no formato:
{
  "isExame": true | false,
  "resumoParaPaciente": "1 parágrafo curto (até 400 caracteres), 2ª pessoa, tom acolhedor, resumindo os achados nutricionais principais e o que fazer a seguir.",
  "itens": [
    {
      "exame": "Nome do exame (ex: Ferritina)",
      "valor": "Valor + unidade como aparece no laudo (ex: 12 ng/mL) ou vazio se não visível",
      "referencia": "Faixa de referência do laboratório se visível, ou vazio",
      "flag": "alto" | "baixo" | "normal" | "limitrofe" | "indeterminado",
      "leituraNutricional": "1-2 frases descrevendo o significado nutricional (do Guia)",
      "direcionamento": "Ação nutricional prática + se cabe encaminhar médico",
      "encaminharMedico": true | false
    }
  ],
  "alertas": ["Alerta geral 1", "Alerta geral 2"],
  "observacoes": "Notas extras da IA para a Gabriela revisar (ex: itens ilegíveis, unidades ausentes)."
}`;

export type ExameItem = {
  exame: string;
  valor: string;
  referencia: string;
  flag: "alto" | "baixo" | "normal" | "limitrofe" | "indeterminado";
  leituraNutricional: string;
  direcionamento: string;
  encaminharMedico: boolean;
};

export type ExameLeitura = {
  isExame: boolean;
  resumoParaPaciente: string;
  itens: ExameItem[];
  alertas: string[];
  observacoes: string;
};

const MODELO = "google/gemini-3.6-flash";

export async function analisarExameArquivo(input: {
  base64: string;
  mimetype: string;
  observacaoUsuaria?: string | null;
}): Promise<{ ok: boolean; leitura?: ExameLeitura; modelo?: string; error?: string }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { ok: false, error: "LOVABLE_API_KEY ausente" };

  const isPdf = input.mimetype.toLowerCase().includes("pdf");
  const dataUrl = `data:${input.mimetype};base64,${input.base64}`;

  const userText = input.observacaoUsuaria
    ? `A paciente escreveu junto: "${input.observacaoUsuaria}". Analise o exame anexado.`
    : "Analise o exame anexado seguindo o Guia Zero Lipedema.";

  const content: Array<Record<string, unknown>> = [{ type: "text", text: userText }];
  if (isPdf) {
    content.push({
      type: "file",
      file: {
        filename: "exame.pdf",
        file_data: dataUrl,
      },
    });
  } else {
    content.push({
      type: "image_url",
      image_url: { url: dataUrl },
    });
  }

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: MODELO,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${t.slice(0, 300)}` };
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<ExameLeitura>;

    const flagSet = new Set(["alto", "baixo", "normal", "limitrofe", "indeterminado"]);
    const itens: ExameItem[] = Array.isArray(parsed.itens)
      ? parsed.itens.map((i) => {
          const f = String(i?.flag ?? "indeterminado").toLowerCase();
          return {
            exame: String(i?.exame ?? "").slice(0, 120),
            valor: String(i?.valor ?? "").slice(0, 80),
            referencia: String(i?.referencia ?? "").slice(0, 80),
            flag: (flagSet.has(f) ? f : "indeterminado") as ExameItem["flag"],
            leituraNutricional: String(i?.leituraNutricional ?? "").slice(0, 600),
            direcionamento: String(i?.direcionamento ?? "").slice(0, 600),
            encaminharMedico: Boolean(i?.encaminharMedico),
          };
        })
      : [];

    return {
      ok: true,
      modelo: MODELO,
      leitura: {
        isExame: Boolean(parsed.isExame),
        resumoParaPaciente: String(parsed.resumoParaPaciente ?? "").slice(0, 800),
        itens,
        alertas: Array.isArray(parsed.alertas)
          ? parsed.alertas.slice(0, 6).map((a) => String(a).slice(0, 240))
          : [],
        observacoes: String(parsed.observacoes ?? "").slice(0, 800),
      },
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Monta o texto padrão para revisão da Gabriela a partir da leitura da IA. */
export function montarTextoRevisao(leitura: ExameLeitura, nome: string | null): string {
  const primeiro = (nome ?? "").split(" ")[0] || "linda";
  const linhas: string[] = [];
  linhas.push(`Oi ${primeiro} 💙 Aqui é da Dra. Gabriela Rosado — dei uma olhada nos seus exames.`);
  linhas.push("");
  if (leitura.resumoParaPaciente) {
    linhas.push(leitura.resumoParaPaciente);
    linhas.push("");
  }
  const relevantes = leitura.itens.filter((i) => i.flag !== "normal");
  if (relevantes.length) {
    linhas.push("*Pontos que quero destacar:*");
    for (const i of relevantes) {
      const flagLabel =
        i.flag === "alto" ? "↑ alto"
        : i.flag === "baixo" ? "↓ baixo"
        : i.flag === "limitrofe" ? "≈ limítrofe"
        : "•";
      linhas.push(`\n• *${i.exame}* (${flagLabel}${i.valor ? ` — ${i.valor}` : ""})`);
      if (i.leituraNutricional) linhas.push(`  ${i.leituraNutricional}`);
      if (i.direcionamento) linhas.push(`  👉 ${i.direcionamento}`);
      if (i.encaminharMedico) linhas.push(`  ⚠️ Vale procurar avaliação médica também.`);
    }
    linhas.push("");
  }
  if (leitura.alertas.length) {
    linhas.push("*Atenção:*");
    for (const a of leitura.alertas) linhas.push(`• ${a}`);
    linhas.push("");
  }
  linhas.push("Qualquer dúvida me responde por aqui. ✨");
  linhas.push("_Leitura nutricional (CFN 306/2003) — não substitui avaliação médica._");
  return linhas.join("\n");
}
