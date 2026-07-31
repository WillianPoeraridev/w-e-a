# Núcleo · Contexto do Projeto

> Documento de referência para conversas futuras com Claude. Contém todas as decisões estratégicas, técnicas e de posicionamento tomadas durante o brainstorm inicial (maio 2026). Cole no início de qualquer conversa onde Núcleo será discutido.

---

## 1. O Produto

**Nome:** Núcleo
**Manifesto/filosofia:** Sistema.
**Tagline central:** *"Sistema é o que sobra quando a motivação acaba."*
**Tese polarizadora:** *"Força de vontade é o plano dos amadores."*
**Categoria:** Life OS — SaaS premium para indivíduos.

**Pitch de uma frase:** O Núcleo é o cockpit operacional que integra 10 áreas da vida em um sistema único, onde a IA cruza módulos pra revelar padrões invisíveis e gerar rituais semanais profundos.

**Posicionamento contra:** coach motivacional, hábitos atômicos versão livro-de-aeroporto, hustle culture, app de hábito que abandona em 3 semanas, template Notion premium, Open Finance automatizado, wearable sem contexto.

---

## 2. Persona

Homem 28-38, profissional ambicioso construindo vida adulta séria. Renda R$8k-30k/mês. Dev, gestor, consultor, founder solo, freelancer high-ticket. Treina ou quer treinar sério. Sente que rende abaixo do potencial e culpa força de vontade.

Persona única **(não casal).** Módulo de Relação no MVP é single-user.

---

## 3. Estrutura modular (10 módulos / 3 pilares + North Star)

```
                  PROPÓSITO & PROJETOS (North Star)
                              |
        ┌─────────────────────┼─────────────────────┐
       CORPO                 MENTE                 MUNDO
   Sono · Treino         Foco · Ansiedade      Finanças · Relação
   · Nutrição            · Aprendizado         · Vícios
```

### Calibração de profundidade
- **ALTA:** Treino, Finanças, Propósito, Weekly Review
- **MÉDIA:** Sono, Foco, Relação, Aprendizado
- **LEVE:** Nutrição, Ansiedade (input leve / correlações profundas), Vícios

### Decisões críticas por módulo

- **Finanças:** entrada **manual** obrigatória. Anti Open Finance é tese central. "Quem deixa o banco categorizar gasto vive a vida do banco." Sinking funds, freedom number, alertas de desvio, cruzamento com ansiedade (gasto emocional).
- **Ansiedade:** NÃO posicionar como controle/tratamento clínico. Posicionar como *rastreamento de variáveis* e *mapeamento de padrões*. CFP não interfere se não há promessa de tratamento. Dado sensível LGPD — audit_log obrigatório.
- **Treino:** foco em naturais, progressão de carga, autorregulação por RPE/RIR, deload por sono+ansiedade.
- **Relação:** single-user. Sem feature de casal no MVP. Pode evoluir em V2.
- **Vícios:** dado sensível LGPD. Posicionamento: regulação de padrões, não AA.
- **Propósito (North Star):** identity statements, valores, vision 3y, freedom number, projetos âncora. Orquestra tudo.

---

## 4. Coreografia diária

A pessoa interage com o produto em momentos curtos distribuídos:

- **Manhã (90s):** dashboard cerimonial com padrões detectados + intenção
- **Treino:** tela otimizada pra séries
- **Pós-treino (30s):** sensação + energia
- **Meio-dia (45s):** check-in energia + foco
- **Bloco de Deep Work:** timer + output
- **Janela de Vícios (1min):** checkpoint do "perigo"
- **Fechamento (3-5min):** energia, ansiedade, uma linha, gastos avulsos
- **Wind-down (passivo):** flags de telas, última refeição, café tardio
- **Domingo 19h (40min):** Weekly Review com IA — o ritual sagrado
- **Último dia do mês:** Monthly Narrative gerada por IA (2-3 páginas)
- **Final de trimestre (1h):** Quarterly Review do North Star

**Fricção diária total:** 10-15 minutos. Acima disso, churn.

---

## 5. Motor central (4 camadas combinadas)

- **Weekly Review** como coração (ritual sagrado, 40min, IA entrega insights cruzados)
- **Dashboard Diário com System Score** (uso de execução)
- **AI Coach Orquestrador** (intervenções proativas em momentos certos)
- **Monthly Narrative** (texto narrativo pessoal, 2-3 páginas, gerado pela IA)

A IA não dá conselho genérico. Ela **cruza dados das 10 áreas** pra revelar padrões invisíveis (correlations engine + statistical thresholds + Claude interpretando).

---

## 6. Identidade visual: Engineering Brutalism

**Referências vivas:** Linear, Vercel, Raycast, internet.exposed, Rauno.me.

**Paleta:**
- Preto profundo: #0A0A0A
- Grafite: #1A1A1A
- Cinza-aço: #6B6B6B
- Cinza claro: #A8A8A8
- Off-white: #F5F5F4
- Acento: branco neon ou cinza claro

**Tipografia:**
- Sans: Inter (display, prosa, UI)
- Mono: JetBrains Mono (números, labels técnicos)

**Regras:**
- Sem gradientes, sombras pesadas, ornamentos
- Borders 0.5px (utility `border-hairline`)
- Sentence case (exceto mono labels técnicos em CAPS)
- Density calibrada (Linear-style)
- Mono caps pra labels: "SEM 20 / DIA 138", "PADRÃO DETECTADO"
- Ícones só funcionais (Lucide outline)
- Zero emoji decorativo

---

## 7. Stack técnica final

| Camada | Escolha |
|---|---|
| Framework | Next.js 16 + App Router + RSC + Server Actions |
| Linguagem | TypeScript strict (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`) |
| Styling | Tailwind v4 + CSS variables |
| ORM | Drizzle + drizzle-kit (migrations SQL versionadas, nunca push em prod) |
| DB | Neon Postgres + pgvector (branches dev/staging/production) |
| Driver | `neon-http` por padrão, `neon-serverless` (WebSocket) pra hard delete LGPD |
| Auth | Better-Auth 1.6 (sessões em DB, 30 dias, senha mín 10, email verification obrigatória) |
| AI | Claude Sonnet 4.6 (análise) + Haiku 4.5 (latência) via API |
| Background jobs | Trigger.dev v3 |
| Pagamento | Cakto |
| Storage | Vercel Blob |
| Email | Resend |
| Analytics + Feature Flags | PostHog |
| Observabilidade | Sentry + BetterStack |
| Charts | Recharts |
| State | Zustand (UI) + TanStack Query (server) |
| Quality | Biome (lint + format) |
| Testing | Vitest + Playwright |
| Mobile | PWA primeiro, Expo na V2 |
| Deploy | Vercel |

### Princípios não-negociáveis

1. TypeScript strict total
2. Drizzle ORM, migrations versionadas, nunca push em prod
3. Application-level isolation com helper `scopedDb(userId)`
4. LGPD desde dia zero (audit_log, consents, deletion_requests)
5. Server Components por padrão
6. Server Actions para mutations
7. Validação Zod em toda entrada
8. Audit log em mudanças de dados sensíveis
9. Soft delete + hard delete por cron (15 dias)
10. Feature flags via PostHog
11. Sem `any`, sem `as` casting
12. Indexes em FKs sempre
13. `created_at` / `updated_at` em toda tabela
14. Commits convencionais
15. Cada feature precisa de teste
16. Datas em `timestamptz` (UTC absoluto)
17. **Revogação de consentimento NÃO dispara exclusão** (são ações independentes)

---

## 8. Modelo comercial

**Estrutura:** pagamento único + acesso 12 meses (não vitalício) + garantia 14 dias incondicional.

### Escada de pricing

| Fase | Período | Ticket | Lógica |
|---|---|---|---|
| Turma Fundadores | Mês 0-2 | R$ 1.997 | Validação, 30-50 vagas, lock-in vitalício de preço |
| Turma Beta | Mês 3-5 | R$ 2.997 | Audiência maior, primeiros depoimentos |
| Turma Núcleo | Mês 6+ | R$ 4.997 | Moneybrand consolidada, autoridade construída |

**Plataforma:** Cakto (suporta PIX, cartão, garantia automatizada, ticket alto BR).

**Modelo Doug Demarco:** sem call de vendas, sem SDR, sem funil tradicional. Audiência construída em público, oferta abre, quem quer paga.

---

## 9. Estratégia MoneyBrand

### Tese central

Marca pessoal desenhada pra gerar dinheiro. Três pilares:
- **Atenção:** conteúdo polarizador que para o feed
- **Confiança:** bastidor diário, não aula motivacional
- **Conversão:** Google Doc como convite, não pitch

### Cadência geral

- 3 fases temporais alinhadas aos sprints
- **Fase 1 (S0-S3):** Construção em público
- **Fase 2 (S4-S6):** Esquentamento, lista cresce
- **Fase 3 (S7-S10):** Pré-lançamento + abertura Turma Fundadores

### Mix de conteúdo

- 40% bastidor de construção
- 30% teses polarizadoras
- 15% vida real alinhada (5am, treino, dieta, filho)
- 10% educacional
- 5% convite pra lista de espera

### Decisões críticas

- **Sem avatar de IA.** Você aparece pessoalmente. Vulnerabilidade da primeira foto ruim É o ativo.
- **Plano de 7 dias** pra romper bloqueio inicial (foto café 4:30, mesa, selfie pós-treino, vídeo curto, primeiro post manifesto).
- **Uniforme estável** (preto/cinza/básico) — não precisa variar roupa.
- **Casa em Tramandaí é o cenário** — luz natural 5-7am, cozinha, mesa de trabalho, espaço de treino, vista.
- Cadência exata e plano de conteúdo ficam fora do repositório (em vault Obsidian separado).

### Posts âncora pelos quais começar

1. Manifesto longo ("Força de vontade é o plano dos amadores")
2. Apresentação pessoal
3. Tese Anti Open Finance
4. Bastidor do build
5. 5 da manhã (vida real)
6. Tese "Quem precisa de motivação todo dia..."
7. Bastidor técnico (módulo Ansiedade)
8. Núcleo por dentro (screenshot)
9. Vida + insight
10. Convite lista de espera

---

## 10. Roadmap de execução

### S0 · Foundation (9 partes, ~12 dias úteis)

- **S0.1:** Setup Next.js 16, TS strict, Biome, estrutura, CLAUDE.md
- **S0.2:** Design system base brutalist + style-guide
- **S0.3:** Neon + Drizzle + scopedDb + schema base + LGPD tables
- **S0.4:** Better-Auth + consent flow LGPD (3 consentimentos no signup)
- **S0.5:** Resend + email verification + welcome
- **S0.6:** Landing brutalist + waitlist + manifesto
- **S0.7:** LGPD operacional (deletion + export + revogar)
- **S0.8:** Sentry + PostHog + logger estruturado
- **S0.9:** CI/CD + deploy + hardening

### S1-S10 · Produto (~55 dias úteis, 9-11 semanas)

- **S1:** Módulo PROPÓSITO + Onboarding cerimonial
- **S2:** Módulos CORPO (Sono MED, Treino ALTA, Nutrição LEVE)
- **S3:** Módulos MENTE (Foco MED, Ansiedade LEVE input/ALTA correlações, Aprendizado MED)
- **S4:** Módulos MUNDO (Finanças ALTA, Relação MED single-user, Vícios LEVE)
- **S5:** Orquestração + Coreografia diária + Weekly Review v1 (regras simples)
- **S6:** AI Layer v1 — correlations engine + Weekly Review v2 (IA gerativa)
- **S7:** Monthly Narrative + Chat conversacional sobre os dados
- **S8:** Billing Cakto + escada de pricing + 12 meses
- **S9:** LGPD completo + polish + beta privado (5-10 convidados não-pagantes)
- **S10:** Launch Turma Fundadores (R$1.997, 30-50 vagas)

### Convenção de versionamento

Sempre v1 → v2 (iterativo, não substitutivo). Aplica em qualquer feature que tenha versão simples primeiro e enriquecimento de IA depois.

---

## 11. LGPD (compliance crítico)

O Núcleo coleta dados sensíveis (Art. 5 LGPD): saúde mental (ansiedade), padrões de vícios, finanças pessoais, relacionamento.

### Obrigações operacionais

- Consentimento explícito no onboarding (2-3 checkboxes separados, não enterrados em ToS)
- Audit log de leitura/escrita em dados sensíveis
- Right to erasure: hard delete em 15 dias após pedido EXPLÍCITO
- Revogação de consentimento ≠ exclusão (são ações independentes)
- Data portability: export JSON completo
- Breach notification: 3 dias úteis pra ANPD + usuários
- Privacy Policy + Termos em português claro
- Revisão jurídica obrigatória antes da Turma Fundadores

### Tabelas LGPD obrigatórias

- `consents` (registro de consentimento com IP, UA, versão)
- `audit_log` (toda mudança em dados sensíveis)
- `deletion_requests` (pedidos com timestamp + hard delete em 15 dias)
- `data_exports` (geração de exports, URLs expiráveis em 7 dias)

### Pendência aberta

Driver `neon-http` não suporta transações interativas. Hard delete LGPD precisa atomicidade. Decisão (preferida): migrar pra `neon-serverless` (WebSocket) só pro job de hard delete. Decisão final na S0.7.

---

## 12. Estrutura do repositório

```
nucleo/
├── CLAUDE.md                      # fonte de verdade, lida em toda sessão
├── docs/
│   ├── decisions/                 # ADRs (Architectural Decision Records)
│   ├── roadmap.md                 # progresso atual
│   └── lgpd/
├── drizzle/                       # migrations geradas
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (marketing)/
│   │   ├── (app)/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── modules/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   │   └── schema/
│   │   ├── lgpd/
│   │   ├── ai/
│   │   ├── jobs/
│   │   └── utils/
│   ├── server/
│   │   ├── actions/
│   │   └── webhooks/
│   └── types/
└── tests/
```

---

## 13. Status atual (atualizar conforme avança)

**Última sessão:** maio 2026
**Posição:** S0.5 (Resend) pronto pra rodar
**Concluído:** S0.1 (setup), S0.2 (design system), S0.3 (DB), S0.4 (auth)
**ADRs criados:**
- ADR 0001 — Revogação de consentimento separada de exclusão

**Decisões técnicas registradas:**
- Next.js 16 (versão atual)
- Better-Auth dono da tabela `user` com FK em `user.id`
- `generateId: false`, Postgres gera UUID via `gen_random_uuid()`
- Todas as datas em `timestamptz`
- Driver `neon-http` por padrão
- `proxy.ts` substitui `middleware.ts` (Next 16)
- Dev roda em `localhost:3001`
- Application-level isolation com `scopedDb`, não RLS

---

## 14. Como usar este documento

Em conversa nova com Claude:

> "Vou te passar o contexto do meu projeto Núcleo. Por favor lê tudo antes de responder qualquer coisa. Se for fazer sugestões, elas devem ser consistentes com as decisões já travadas aqui."
>
> [cole o documento]
>
> Pergunta: [sua pergunta]

Atualize a seção 13 conforme novos sprints forem concluídos.
