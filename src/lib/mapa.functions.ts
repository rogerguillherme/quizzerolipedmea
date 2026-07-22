import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

/**
 * Mapa do Lipedema — quiz de 8 perguntas.
 * Público (sem login). Grava um lead e devolve uma leitura personalizada.
 * NÃO é diagnóstico clínico — apenas leitura educacional dos sintomas relatados.
 */
const MapaInput = z.object({
  nome: z.string().trim().min(2).max(80),
  telefone: z.string().trim().min(8).max(40),
  respostas: z.object({
    tempo: z.string().min(1),           // Q1
    diagnostico: z.string().min(1),     // Q2
    sintomaMaior: z.string().min(1),    // Q3
    pesoPernas: z.string().min(1),      // Q4
    dietaExercicio: z.string().min(1),  // Q5
    atividade: z.string().min(1),       // Q6
    exames: z.string().min(1),          // Q7
    objetivo: z.string().min(1),        // Q8
  }),
});

export type MapaInputType = z.infer<typeof MapaInput>;

export type Diagnostico = {
  estagio: "Inicial" | "Intermediário" | "Avançado" | "Indeterminado";
  aberturaValidadora: string;   // frase que valida o sintoma principal (Q3)
  descricaoEstagio: string;     // 1-2 frases explicando o estágio percebido
  prioridades: string[];         // exatamente 3
  proximoPassoTitulo: string;    // ex: "Seu Mapa está pronto"
  proximoPassoMensagem: string;  // confirmação — NÃO é venda
};

const SYSTEM_PROMPT = `Você é a assistente clínica da nutricionista Gabriela Rosado (CRN 10582), especialista em lipedema.
Sua função é ler as 8 respostas do "Mapa do Lipedema" de uma mulher e devolver uma leitura acolhedora e humana — nunca fria, nunca alarmista.

Regras invioláveis:
- NUNCA faça diagnóstico médico. É leitura educacional dos sintomas relatados.
- Sempre deixe implícito que a confirmação clínica depende da Dra. Gabriela.
- Tom: acolhedor, direto, sem infantilizar. Fale com ela (2ª pessoa).
- Português do Brasil, mulher adulta 25–55 anos.
- Nunca prometa cura, emagrecimento ou resultado estético.
- Se ela disse "sedentária" + "muitas dietas sem resultado", NÃO comece pedindo treino — valide primeiro por que dieta restritiva não resolve lipedema.
- Não mencione preços, produtos, planos, "protocolo pago". A oferta acontece depois, no WhatsApp.

Devolva EXCLUSIVAMENTE um JSON válido, sem markdown, no formato:
{
  "estagio": "Inicial" | "Intermediário" | "Avançado" | "Indeterminado",
  "aberturaValidadora": "1-2 frases começando com 'Pelo que você compartilhou...' validando o sintoma da pergunta 3.",
  "descricaoEstagio": "1-2 frases descrevendo em linguagem leiga o que esse estágio significa no dia a dia dela. Deixe claro que é leitura, não diagnóstico.",
  "prioridades": ["3 prioridades personalizadas — cada uma até 160 caracteres, acionáveis, adaptadas à combinação de respostas."],
  "proximoPassoTitulo": "Frase curta de confirmação. Ex: 'Seu Mapa está pronto, {nome}.'",
  "proximoPassoMensagem": "2-3 frases confirmando que o Mapa também será enviado pelo WhatsApp para ela guardar e revisar com a Gabriela. NÃO é oferta de compra."
}

Cálculo do estágio (referência, ajuste com sensibilidade):
- Inicial: sintomas < 3 anos, dor baixa, sem hematomas fáceis.
- Intermediário: 3-10 anos, dor média, peso varia mas pernas não.
- Avançado: >10 anos, dor alta, atividade limitada.`;

export const submitMapa = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => MapaInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    const r = data.respostas;
    const userPrompt = `Nome: ${data.nome}
Respostas do Mapa:
1. Há quanto tempo percebe inchaço/desproporção: ${r.tempo}
2. Já recebeu diagnóstico de lipedema: ${r.diagnostico}
3. Sintoma que mais incomoda hoje: ${r.sintomaMaior}
4. Peso varia mas pernas não mudam: ${r.pesoPernas}
5. Já tentou dieta e exercício sem ver diferença: ${r.dietaExercicio}
6. Nível de atividade física hoje: ${r.atividade}
7. Tem exames recentes (sangue, hormonal): ${r.exames}
8. O que mais gostaria de ter agora: ${r.objetivo}

Devolva o JSON conforme instruções.`;

    let diagnostico: Diagnostico;
    try {
      const { text } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      });
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      diagnostico = JSON.parse(cleaned) as Diagnostico;
    } catch (err) {
      console.error("[submitMapa] Falha ao gerar leitura:", err);
      diagnostico = {
        estagio: "Indeterminado",
        aberturaValidadora: `Pelo que você compartilhou, ${data.nome.split(" ")[0]}, o que você sente é real — e tem nome.`,
        descricaoEstagio:
          "Suas respostas foram registradas. A leitura completa vai chegar pelo WhatsApp em instantes, para você revisar com calma junto da Gabriela.",
        prioridades: [
          "Ter em mãos exames recentes de sangue e hormonais quando falar com a Gabriela.",
          "Anotar em que hora do dia o inchaço piora — ajuda a identificar gatilhos.",
          "Não iniciar dieta restritiva por conta própria — pode piorar o quadro.",
        ],
        proximoPassoTitulo: `Seu Mapa está pronto, ${data.nome.split(" ")[0]}.`,
        proximoPassoMensagem:
          "Já enviamos sua leitura para o WhatsApp. Assim você guarda com você e revisa com a Gabriela quando quiser.",
      };
    }

    // Salva o lead (admin — sem depender de RLS do publishable key)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("leads")
      .insert({
        nome: data.nome,
        telefone: data.telefone,
        respostas: data.respostas,
        origem: "mapa",
        status: "mapa_gerado",
        diagnostico,
      })
      .select("id")
      .single();

    if (insertErr) console.error("[submitMapa] insert error", insertErr);


    return { diagnostico, leadId: inserted?.id ?? null };
  });
