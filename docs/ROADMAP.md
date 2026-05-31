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
- [x] Gráficos: gastos por categoria + evolução 6 meses · troca de mês (com seletor de mês/ano)
- [x] Visão geral: aba anual (12 meses, totais, médias, taxa de poupança, categorias) + acumulado/patrimônio
- [ ] ⬜ Orçamento por categoria (limite mensal + alerta ao estourar)
- [ ] ⬜ Filtro da lista por pessoa/categoria/escopo
- [ ] ⬜ Relatório do mês + exportar CSV
- [ ] 💡 Carteiras/contas (Nubank, dinheiro, etc.) e saldo por conta
- [ ] 💡 Dívidas/parcelamentos e projeção de quitação

---

## ✅ Fase 2 — 📅 Agenda + ✅ Hábitos (CONCLUÍDA)
**Agenda** ✅ *(calendário no ar)*
- [x] Calendário compartilhado (grade do mês), eventos pessoais e do casal, cor por pessoa
- [x] Criar/editar/excluir evento, dia inteiro ou horário, local e notas, painel do dia
- [x] "Próximos eventos" + navegação de mês + fuso SP correto (round-trip testado)
- [x] Feriados nacionais do Brasil automáticos (fixos + móveis: Carnaval, Sexta-feira Santa, Corpus Christi)
- [ ] ⬜ Visão semana/dia + arrastar pra remarcar
- [ ] ⬜ "Próximos eventos" também no dashboard "Hoje"
- [ ] 💡 Sincronizar **Google Calendar** (tenho acesso via MCP) — 2 vias

**Hábitos** ✅ *(tracker no ar)*
- [x] Hábitos diários por pessoa/casa (água, treino, leitura, código…), cor e meta (Nx/dia)
- [x] Check do dia (toca pra marcar/incrementar), **streak 🔥** e tirinha dos últimos 7 dias (editável)
- [x] Horário + emoji por hábito · agrupado por período (manhã/tarde/noite) · recorde + fogo animado
- [x] Resumo "X de Y concluídos hoje" + cálculo de streak testado
- [ ] ⬜ Cadência semanal (Nx/semana) + anel de progresso no dashboard "Hoje"

## ✅ Fase 3 — 🏋️ Treino + 😴 Sono (CONCLUÍDA)
**Treino** ✅ *(no ar)*
- [x] Registrar treino (tipo, duração, exercícios com séries/reps/carga), por pessoa
- [x] Feed dos treinos + resumo da semana (treinos · minutos)
- [x] **Progressão por exercício** (gráfico de carga ao longo do tempo)
- [ ] ⬜ Templates de treino reutilizáveis (A/B/C) + volume total

**Sono** ✅ *(no ar)*
- [x] Log de sono (deitou/acordou → duração automática, qualidade 1–5 ⭐), por pessoa
- [x] Resumo da semana (média de horas, qualidade média, noites) + gráfico 14 dias (cor por faixa)
- [x] Histórico editável (upsert por pessoa/dia) + toggle de pessoa
- [ ] 💡 Correlação sono × treino × humor + "última noite" no dashboard

## ✅ Fase 4 — 📚 Estudos + 💜 Relacionamento (CONCLUÍDA)
**Estudos** ✅ *(no ar)*
- [x] Trilhas de estudo (Willian Dev PJ + **Angélica do zero**) com progresso, status, link
- [x] Sessões de estudo (tempo focado) + resumo da semana + **sequência (dias seguidos)**
- [x] Tempo estudado por trilha + "Estudar agora" + sessões recentes
- [x] **Radar de tech**: salvar artigos/vídeos/novidades, marcar como lido, tags
- [ ] ⬜ Roadmap guiado da Angélica (passo a passo) + pomodoro integrado

**Relacionamento** ✅ *(no ar)*
- [x] Check-in do casal (humor 😄, gratidão, destaque, o que melhorar)
- [x] Mural de gratidão entre vocês dois (composer rápido)
- [x] Backlog de **date ideas** (categoria, custo, marcar como feito)
- [x] Datas especiais com **contagem regressiva** (aniversário de namoro, niveres) + "X anos"

## 🚧 Fase 5 — 🎯 Metas/OKR + Revisão semanal
**Metas** ✅ *(no ar)*
- [x] Metas amarradas aos **3 pilares** (Gestão · Relacionamento · Carreira), agrupadas
- [x] **Etapas "degrau por degrau"** (marcáveis) → progresso automático; ou progresso manual
- [x] Status (ativa/pausada/concluída), prazo com contagem de dias, de quem (pessoa/casa)
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
- **Feito:** Fundação · Finanças (mês + visão geral) · Agenda (com feriados) · Hábitos.
- **Agora:** usar no dia a dia + **deploy na Vercel** (pra cair no celular dos dois).
- **Próximo (escolher 1):** Treino+Sono · ou · Estudos (trilha da Angélica) · ou · Metas.
- **Depois:** Relacionamento → Metas/Revisão semanal → notificações.

> Dica: a cada sessão, escolhemos **um** módulo e entregamos ele redondo. Sem pressa, bem feito. 💪
