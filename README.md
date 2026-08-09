# Lipedema Clarity

Construa um aplicativo web chamado Zero Lipedema, voltado para mulheres com lipedema, conectado à nutricionista Gabriela Rosado (CRN 10582) e a um agente de IA no WhatsApp. O produto tem três camadas: uma avaliação de entrada gratuita (Mapa do Lipedema), um desafio pago de 7 dias, e um protocolo premium de 90 dias (Método Derma). Mobile-first, para um público majoritariamente feminino, 25-55 anos, que já tentou dieta/treino sem resultado e busca ser levada a sério.

1. Sistema de design

Cor: azul predominante, mas na variação sofisticada que os apps de saúde de 2026 usam — um azul-safira/prussiano profundo (algo como #1B3A57 a #2C5F7C), não um azul saturado genérico. Use design tonal: várias tintas e tons do mesmo azul pra criar hierarquia (fundo bem claro quase branco-azulado para telas, azul médio para cards, azul profundo para textos de destaque e headers). Isso transmite confiança clínica sem parecer frio.

Cor de contraste: um tom quente (coral suave ou dourado/terracota) só para botões de ação principal e elementos de celebração (completar um dia, desbloquear algo) — o azul não deve competir com o CTA, ele deve emoldurar.

Fundo: branco quente/off-white (não branco hospitalar puro) — reduz a sensação clínica/fria que aumenta ansiedade em quem já se sente maltratada pelo sistema de saúde.

Tipografia: sans-serif arredondada, amigável, tamanhos grandes e alto contraste (público inclui mulheres 40-55 anos; não sacrificar legibilidade por estética).

Componentes: cards com cantos arredondados como unidade básica de informação (um card por métrica, um card por missão do dia) — não tabelas densas. Saudação personalizada no topo da tela inicial ("Oi, [nome], hoje é o dia 3 do seu desafio").

2. Onboarding — "Mapa do Lipedema" (gratuito, sem paywall antes)

Quiz progressivo de 6-8 telas (uma pergunta por tela, completável em ~2 minutos — o tráfego que chega aqui é frio, clique de anúncio sem intenção prévia de baixar um app, então cada tela a mais reduz conclusão). Cada resposta atualiza visualmente um "mapa" do caso dela em tempo real (ilustração do corpo ganhando anotações conforme ela responde) — cria investimento emocional rápido, sem o exagero de onboardings longuíssimos tipo Noom (13+ minutos), que só funcionam pra quem já chega com alta intenção.

Perguntas essenciais: há quanto tempo percebe inchaço/dor, se já tentou dieta/exercício sem resultado, onde sente mais desconforto (pernas, braços), um ponto de histórico hormonal (ciclo, gestações ou menopausa), casos na família, impacto emocional/autoestima.

Tela final: revelação do "Mapa" — resumo visual personalizado citando respostas literais dela (ex: "Você mencionou que já tentou dieta e não resolveu — isso faz sentido, porque..."). Pico emocional da experiência. Não force login ou pagamento antes desse ponto.

3. VSL personalizada (logo após o Mapa, dentro do app)

Vídeo curto (3-5 minutos), com botão de play centralizado no mesmo estilo visual do restante do app (cards azuis, não um player genérico destoante). Conteúdo:

Referencia elementos específicos do resultado dela.

Explica a causa hormonal/inflamatória do lipedema ("não é falta de força de vontade").

Apresenta o Desafio Zero Lipedema de 7 dias como próximo passo.

Termina com CTA direto para o checkout.

4. Checkout do Desafio de 7 Dias

Preço: R$57 (Pix em destaque visual — botão principal na cor de contraste quente —, cartão parcelado como alternativa secundária).

Order bump no mesmo checkout, ativável com um clique: treino direcionado + aula bônus gravada da Gabriela (ou kit físico de chá/shot), R$27-37.

Garantia visível ("complete os 7 dias e se não sentir diferença, devolvemos") perto do botão de pagar — condicionada a engajamento mínimo com a cadência do WhatsApp (rastreável pelo status de jornada já existente no sistema), não reembolso automático sem uso.

Prova social (print de depoimento real) próximo ao botão.

Formulário mínimo: nome, telefone, pagamento. Nada de criar senha antes de pagar.

Ao confirmar pagamento, disparar automaticamente a primeira mensagem da cadência de WhatsApp em poucos minutos.

5. Estrutura do app pós-compra (todas as telas)

Navegação inferior fixa (bottom navigation), 4 abas:

Início/Radar: aplica o padrão de divulgação progressiva usado pelo Whoop — uma pontuação única e simples no topo ("Seu Progresso Hoje", 0-100 ou um selo visual tipo "leve/moderado/ótimo"), que expande para um gráfico de tendência dos últimos dias ao tocar, e só quem quiser vai mais fundo (histórico completo de sintomas). Não jogar todos os dados densos de uma vez — complexidade só aparece quando a usuária pede.

Missões diárias: um card por missão do dia (molde de prato pra montar a refeição — não cardápio fechado —, chá/shot indicado do Catálogo de Prescrição, movimento simples de autocuidado, pergunta de feedback que atualiza o sistema). Sequência de dias completos (streak) visível com um anel de progresso ou selo, e uma pequena celebração visual ao completar o dia — sem exagerar em gamificação, o gancho emocional é sentir menos dor, não colecionar troféus.

WhatsApp: painel mostrando a conversa com o agente de IA — reforça que o WhatsApp é o canal principal de entrega; o app é o apoio visual, não o contrário.

Método Derma: aba visível mas trancada (ícone de cadeado sutil, não agressivo), mostrando prévia do que inclui — anamnese completa, leitura de exames, prescrição personalizada de 90 dias, aulas gravadas da Gabriela, acesso a Q&A ao vivo com ela. Libera só mediante upgrade pago.

Tela de perfil/configurações separada (fora da bottom nav, acessível pelo ícone no header): dados da conta, histórico de pagamento, preferência de notificação (avisos ao longo do dia vs. resumo único).

6. Modelo de suporte (importante para escala)

No tier de entrada (7 dias), todo o acompanhamento é automatizado — agente de IA treinado no método da Gabriela, escalando para ela apenas quando não sabe responder. Não prometa contato pessoal diário da Gabriela nesse tier — isso quebra a escala. Acesso humano real e direto a ela é exclusividade do Método Derma (cohort menor, sustentável em volume baixo).

7. Regras de compliance (não pular)

Nutricionista (CRN) não prescreve medicamento nem exercício estruturado — qualquer conteúdo de movimento deve ser autocuidado geral (elevação de pernas, bomba de tornozelo, respiração diafragmática, caminhada leve), nunca uma "prescrição de treino".

Fitoterápicos/chás/manipulados seguem classificação liberado / bloqueado / fora do escopo (já definida no Catálogo de Prescrição — respeitar essa base, não inventar novas indicações).

Anamnese completa e leitura de exames são exclusivas do Método Derma — não replicar esse conteúdo em nenhum tier abaixo, para não esvaziar o motivo de upgrade.

Todo conteúdo é educacional/de estilo de vida, não substitui avaliação médica — deixar isso claro em algum ponto da jornada.

8. O que já existe e deve ser preservado/reaproveitado

Tabela journey_enrollments com status de jornada por lead (readiness_status, start_date, engagement_mode).

Edge functions: mapa-welcome-whatsapp, journey-scheduler, journey-ai-reply, reset-lead-password, protocol-entry-payment-webhook.

Rotas: /app, /onboarding, /protocolo/pagamento.

Não recriar do zero o que já funciona nessas peças — o pedido é reestruturar o onboarding, o checkout, o design visual e a hierarquia de abas em cima da base técnica existente.

Nota sobre o modelo de negócio

Este prompt reflete a estrutura de 3 camadas confirmada (7 dias → bump → Método Derma). A camada de Acompanhamento recorrente mensal (R$97-129/mês, ancorada em reposição de produto) que discutimos na fase de planejamento ainda está em aberto — não foi incluída aqui até você confirmar se ela deve voltar como uma quarta camada.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://quizzerolipedmea.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4a9b7442-01d5-4766-8c69-f473718afe8b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
