# WeA — Sistema de Vida do Willian & Angélica 💜

O "Life OS" do casal: **finanças, agenda, treino, sono, estudos, metas, hábitos e
relacionamento** em um só lugar. Completo no fluxo, simples na profundidade.

> **Hoje (v1):** fundação completa + módulo **Finanças 100% funcional**. Os outros
> módulos já têm o banco de dados modelado e nascem nas próximas sessões.

📍 **[Roadmap completo do projeto → `docs/ROADMAP.md`](docs/ROADMAP.md)** — o que já existe e o que falta, fase por fase.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript strict)
- **Tailwind v4** + UI kit próprio estilo shadcn + **Recharts**
- **Postgres (Neon)** + **Drizzle ORM** (migrations explícitas)
- **Better Auth** (e-mail/senha) — 1 household, 2 contas
- **Zod** em toda fronteira · **dinheiro sempre em centavos** · datas em SP / UTC no DB
- **PWA** instalável (manifest + service worker)
- Deploy: **Vercel** · Testes: **Vitest**

## Rodando localmente

1. **Banco (Neon).** Crie um projeto free em https://neon.tech e copie a connection
   string (use a **Pooled connection**). Cole em `.env.local` (já existe um com um
   secret gerado — só troque o `DATABASE_URL`).

2. **Instale, migre e popule:**

   ```bash
   pnpm install
   pnpm db:migrate     # cria as 25 tabelas no Neon
   pnpm db:seed        # household "Casa W&A" + 2 contas + categorias + contas fixas
   ```

3. **Suba o app:**

   ```bash
   pnpm dev            # http://localhost:3000
   ```

   Logins criados pelo seed (troque as senhas depois):
   - **Willian** — `willianpoerari.dev@gmail.com` / `casaWeA@2026`
   - **Angélica** — `angelica@wea.app` / `casaWeA@2026`

## Scripts

| Comando | O quê |
|---|---|
| `pnpm dev` | Dev server (webpack) |
| `pnpm build` | Build de produção |
| `pnpm test` | Testes (Vitest) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:generate` | Gera migration a partir do schema |
| `pnpm db:migrate` | Aplica migrations no banco |
| `pnpm db:studio` | Drizzle Studio (inspeção visual) |
| `pnpm db:seed` | Popula dados iniciais |

## Deploy na Vercel

1. Suba o repo no GitHub e importe na Vercel. **Root Directory: a raiz do repo** (padrão).
2. Variáveis de ambiente (Production + Preview):
   - `DATABASE_URL` — string do Neon (Pooled)
   - `BETTER_AUTH_SECRET` — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `BETTER_AUTH_URL` — a URL final (ex: `https://wea.vercel.app`)
   - `NEXT_PUBLIC_APP_URL` — a mesma URL
3. Rode `pnpm db:migrate` apontando para o Neon de produção (uma vez).
4. Deploy. Abra no celular → menu → **Instalar app** (PWA).

## Estrutura

```
app/(auth)        login / signup
app/(app)         área logada: dashboard "Hoje" + módulos
app/onboarding    cria o household no primeiro acesso
db/schema         schema Drizzle por contexto (finance, planning, health, …)
features/financas queries, actions (server) e components do módulo Finanças
lib               env, money, dates, auth, household, nav, utils
components/ui      UI kit (button, card, input, modal, …)
```

## Notas técnicas

- Build/dev usam **webpack** (`--webpack`): o Better Auth arrasta um adapter kysely
  que não usamos (usamos Drizzle) e que conflita com o Turbopack. Webpack ignora esse
  código morto. Reavaliar quando o Better Auth corrigir o empacotamento.
- Princípios: TypeScript strict · Zod nas bordas · dinheiro em centavos
  (`lib/money.ts`) · datas UTC no DB e SP na ponta (`lib/dates.ts`) · Conventional Commits.

---

Feito com carinho, em um sábado, em vez de ver série. 🍿➡️💻
