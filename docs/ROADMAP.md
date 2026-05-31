# 🗺️ Roadmap — WeA (Willian & Angélica)

> Sistema de vida do casal. **Completo no fluxo, simples na profundidade.** Degrau por degrau, sem pressa.
> Este arquivo é a fonte da verdade do que já existe e do que falta. Marque os `[ ]` conforme avança.

**Legenda:** ✅ pronto · 🚧 em andamento · ⬜ a fazer · 💡 ideia futura

**Última atualização:** 2026-05-31 · **Versão atual:** v1 (Fundação + Finanças)

---

## 🎯 Os 3 focos que o sistema serve
1. **Gestão impecável** de tempo, dinheiro, treino e estudos.
2. **Relacionamento** leve, romântico e intenso, com propósito de crescimento.
3. **Crescer** educacional e profissionalmente — muito (Willian Dev PJ; Angélica começando do zero).

---

## ✅ Fase 0 — Fundação (CONCLUÍDA)
- [x] Next.js 16 + React 19 + TypeScript strict + Tailwind v4
- [x] UI kit próprio estilo shadcn (button, card, input, modal, select, badge, progress…)
- [x] Better Auth (e-mail/senha) — 1 household "Casa W&A", 2 contas
- [x] Proxy/edge protegendo rotas + onboarding de household
- [x] Drizzle + Neon Postgres — **9 contextos, 25 tabelas**, migration explícita versionada
- [x] Helpers: dinheiro em centavos (testado), datas SP/UTC, env com Zod, household
- [x] Shell com navegação de todos os módulos + dashboard "Hoje"
- [x] PWA instalável (manifest + service worker + ícones)
- [x] Seed com os números reais do casal · build/typecheck/testes verdes

## ✅ Fase 1 — 💰 Finanças (CONCLUÍDA)
- [x] Transações CRUD (entrada/saída, quem pagou, pessoal/compartilhado, pago/pendente)
- [x] Contas fixas recorrentes + botão **"Lançar mês"**
- [x] Visão mensal: entradas, saídas, sobra, a pagar
- [x] **Divisão do casal** (quem deve quanto nos gastos compartilhados)
- [x] Categorias (gerenciador com cor) · Metas de poupança com aporte/retirada
- [x] Gráficos: gastos por categoria + evolução 6 meses · troca de mês
- [ ] ⬜ Orçamento por categoria (limite mensal + alerta ao estourar)
- [ ] ⬜ Filtro da lista por pessoa/categoria/escopo
- [ ] ⬜ Relatório do mês + exportar CSV
- [ ] 💡 Carteiras/contas (Nubank, dinheiro, etc.) e saldo por conta
- [ ] 💡 Dívidas/parcelamentos e projeção de quitação

---

## ⬜ Fase 2 — 📅 Agenda + ✅ Hábitos
**Agenda** *(schema pronto: `calendar_events`)*
- [ ] ⬜ Calendário compartilhado (mês/semana/dia), eventos pessoais e do casal
- [ ] ⬜ Criar/editar/excluir evento, cor por pessoa, dia inteiro
- [ ] ⬜ Lembretes e "próximos eventos" no dashboard
- [ ] 💡 Sincronizar **Google Calendar** (tenho acesso via MCP) — 2 vias

**Hábitos** *(schema pronto: `habits`, `habit_logs`)*
- [ ] ⬜ Hábitos diários/semanais por pessoa (treino, água, leitura, código…)
- [ ] ⬜ Check do dia + streak (sequência) + meta por período
- [ ] ⬜ Anel de progresso do dia no dashboard "Hoje"

## ⬜ Fase 3 — 🏋️ Treino + 😴 Sono
**Treino** *(schema pronto: `workouts`, `workout_sets`)*
- [ ] ⬜ Registrar treino (tipo, duração, exercícios, séries/reps/carga)
- [ ] ⬜ Templates de treino reutilizáveis (A/B/C)
- [ ] ⬜ Progressão por exercício (gráfico de carga/volume)

**Sono** *(schema pronto: `sleep_logs`)*
- [ ] ⬜ Log de sono (deitou/acordou, duração, qualidade 1–5)
- [ ] ⬜ Tendência semanal/mensal + média
- [ ] 💡 Correlação sono × treino × humor

## ⬜ Fase 4 — 📚 Estudos + 💜 Relacionamento
**Estudos** *(schema pronto: `study_tracks`, `study_sessions`, `tech_feed`)*
- [ ] ⬜ Trilhas de estudo (Willian Dev PJ + **Angélica do zero**) com progresso
- [ ] ⬜ Sessões/pomodoro com tempo focado por dia/semana
- [ ] ⬜ **Roadmap de programação da Angélica** (passo a passo guiado)
- [ ] 💡 Feed de updates de tech/mercado (via WebSearch) salvável

**Relacionamento** *(schema pronto: `checkins`, `gratitude_notes`, `date_ideas`, `important_dates`)*
- [ ] ⬜ Check-in do casal (humor, gratidão, destaque, o que melhorar)
- [ ] ⬜ Mural de gratidão entre vocês dois
- [ ] ⬜ Backlog de **date ideas** (marcar como feito)
- [ ] ⬜ Datas importantes (aniversário de namoro, etc.) com lembrete

## ⬜ Fase 5 — 🎯 Metas/OKR + Revisão semanal
*(schema pronto: `goals`, `milestones`)*
- [ ] ⬜ Metas amarradas aos **3 pilares**, com milestones "degrau por degrau"
- [ ] ⬜ Progresso por meta + prazo
- [ ] ⬜ **Revisão semanal**: finanças + hábitos + treino + estudos + relacionamento num só lugar
- [ ] 💡 Metas que puxam dados dos outros módulos (ex: "guardar R$10k" lê a poupança)

---

## ⚙️ Contínuo — Plataforma & polimento
- [ ] ⬜ **Deploy na Vercel** + instalar PWA no celular (passo a passo no [README](../README.md))
- [ ] ⬜ Configurações da conta: **alterar senha**, editar nome/cor
- [ ] ⬜ Convite de membro (substituir o seed por fluxo real de convite)
- [ ] ⬜ Toggle de tema claro/escuro (hoje segue o sistema)
- [ ] ⬜ Notificações (lembretes de conta a pagar, evento, hábito) — e-mail/push
- [ ] ⬜ Exportar/backup dos dados
- [ ] 💡 Voltar pro **Turbopack** quando o Better Auth corrigir o empacotamento do kysely
- [ ] 💡 App "Hoje" mais inteligente: resumo do dia puxando todos os módulos

---

## 👉 Agora / Próximo / Depois
- **Agora:** usar o módulo Finanças no dia a dia + fazer o deploy na Vercel.
- **Próximo (escolher 1):** Agenda+Hábitos · ou · Estudos (trilha da Angélica).
- **Depois:** Treino+Sono → Relacionamento → Metas/Revisão semanal.

> Dica: a cada sessão, escolhemos **um** módulo e entregamos ele redondo. Sem pressa, bem feito. 💪
