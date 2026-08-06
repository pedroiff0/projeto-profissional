# Handoff — Projeto Profissional (template)

> Gerado por Hermes Agent em 06/08/2026. Estado pós-sessão de correção da
> landing (volta ao padrão profissional) e implementação do task manager.

## O que é

Template base de aplicação web (Node 20 + Express + MongoDB/Mongoose + EJS).
Nesta sessão: landing profissional + task manager simples (board + calendário).

## Arquitetura em produção (instância única)

- **Uma instância**, porta **4450** (BIND_ADDR no `.env`, ex.: `100.120.54.126`).
- **3 bancos rodando simultâneos** na mesma instância, via prefixo de rota:
  - Produção `/app`  → banco `app_db`
  - Teste    `/test` → banco `app_test_db`
  - Demo     `/demo` → banco `app_demo_db`
- O `.env` (`NODE_ENV`) controla `production`/`staging`. A demo é sempre
  acessível pela landing (rotas `demo/*`).
- **Isolamento**: o usuário `demo1` (auto-login da demo) existe SÓ no banco
  demo (`carregarDemo` recebe `skipAutoUser` no banco de teste).

## Task manager (o "sistema")

- Model `Task` (`app/src/models/task.model.js`): title, description,
  status (`todo|doing|done`), dueDate, ownerId/ownerName, assigneeId/assigneeName.
- Camadas estritas: `schemas/task.schemas.js` (Zod) → `services/taskService.js`
  → `controllers/task.controller.js` → `routes/task.routes.js` (`/api/tasks`, auth).
- Escopo: usuário comum vê só suas tasks; **admin vê todas**.
- Páginas: `/board` (3 colunas por status; criar/mover/excluir via fetch) e
  `/calendario` (grade mensal com tasks por `dueDate`).
- O nav (topbar) prefixa os links pelo modo do banco (`/demo/board`, etc.) —
  `pageAuth` expõe `res.locals.modo`.
- **Seed**: 10 tasks de exemplo no demo (dono `demo1`) e no teste (dono admin).
  Produção sobe limpa. `app/src/seeds/task.seed.js` + `server.js`.

## Landing

- Padrão profissional do `DESIGN.md` (hero + 3 features). **Sem** os 3 cards de
  banco.
- Mantém: botão de tema claro/escuro (cookie) e seletor de idioma PT/EN/ES/FR
  (cookie + `?lang=`). Seletor de idioma usa texto (não emoji — regra do DESIGN.md).

## Como rodar

```bash
cd app && npm install
npm test                 # Jest + Mongo em memória (63 testes)
npm run dev             # http://localhost:4450

# Docker (produção real)
docker compose up --build
# app na 100.120.54.126:4450 (ver BIND_ADDR no .env)
```

## Demo (auto-login)

- Landing → botão "Demo" → `GET /demo/start` autentica como `demo1@example.com`
  (cookie httpOnly, sem abrir login nem digitar senha) e redireciona para `/demo/`.
- Acesso direto: `http://100.120.54.126:4450/demo/start`.

## Endpoints úteis

- `GET  /api/health/ready` → 200 se o banco está conectado.
- `GET  /api/{modo}/tasks`  (modo = app|test|demo) — lista tasks do usuário.
- `POST /api/{modo}/tasks`  — cria (Zod; 422 se inválido).
- `PATCH/DELETE /api/{modo}/tasks/:id` — move status / remove.

## CSRF

- `csrfGuard` é por Origin/Referer (não token). Fetch mesmo-origin com `Origin`
  correto passa. Não há token manual: o front usa `fetch(..., {credentials:'same-origin'})`.

## Commits relevantes (branch `main`)

- `edae8c9` feat: task manager (board + calendario) e landing profissional (#14)
- `37afc54` fix: server.js passa skipAutoUser ao carregarDemo (#13)
- `4d4cf17` chore: remove script de debug auxiliar

## Verificação (ad-hoc, HTTP real na 4450)

- Container `projeto-profissional-app-1` healthy; `/api/health/ready` → 200.
- Landing sem os 3 cards de banco (grep = 0).
- `/demo/start` → 302 + cookie; `/demo/board` e `/demo/calendario` → 200.
- Tasks seedadas na demo (10+); criar task via API → 201.
- Suíte 63/63 verde; CI (audit + test) passou.

## Notas / pendências conhecidas

- O `common.js` (referenciado no footer) existe; board/calendario usam apenas
  fetch nativo (sem libs).
- Builds antigos de teste/demo (compose separado) foram removidos — agora é
  instância única. Containers `pp-*` (versão antiga na 4447) foram removidos.
- Não há screenshot de verificação visual ainda (usuário ainda não aprovou o
  visual no navegador).
