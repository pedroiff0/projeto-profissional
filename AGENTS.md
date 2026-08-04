# Guia para Agentes

Instruções para agentes de código (Claude Code, Codex, Hermes, Copilot) que
trabalharem neste repositório. Leia antes de escrever qualquer linha.

## Contexto

Template base de aplicação web: autenticação JWT, papéis `admin`/`user`,
registro controlado por administrador. Minimalista de propósito — a graça é
ser um ponto de partida limpo e seguro, não um framework.

## Stack

Node 20 + Express · MongoDB/Mongoose · EJS SSR + JS vanilla · Zod · JWT
(cookie httpOnly ou Bearer) · Jest + Supertest · Docker Compose.

## Arquitetura

```
app/src/
  config/      env.js, db.js
  models/      Mongoose schemas
  services/    regra de negócio
  controllers/ req -> service -> res
  routes/      endpoints
  middleware/  auth, pageAuth, requireRole, csrfGuard, sanitizeInput,
               rateLimiters, errorHandler
  schemas/     Zod
  seeds/       admin.seed.js
  utils/       AppError, validation, audit
```

## Regras arquiteturais

1. **Camadas estritas**: Rota → Controller → Service → Model. Lógica de
   negócio vive no service; controller só traduz HTTP; model só descreve dado.
2. **Zod obrigatório** em todo POST/PUT/PATCH, via `validate(schema)` de
   `utils/validation.js`. Nada de ler `req.body` cru.
3. **Erros com `AppError(msg, status)`** — nunca `throw new Error()`. O
   `errorHandler` é o único lugar que formata resposta de erro.
4. **EJS + JS vanilla**: sem React, sem webpack, sem Babel, sem etapa de build.
   Uma página = um `.ejs` + um `.js` em `public/js/`.
5. **Sem JS inline**: a CSP não permite `unsafe-inline`. Todo script em
   arquivo servido de `/js/`.
6. **Segredos só em `.env`**, lidos por `config/env.js`. Nunca hardcoded.
7. **Teste junto**: rota nova sem teste em `app/tests/` não está pronta.

## O que NUNCA fazer

- ❌ Criar endpoint público de cadastro. O registro é controlado pelo admin,
  por design — é a premissa do template.
- ❌ Devolver `passwordHash`, token de reset ou hash em qualquer resposta.
  Use `authService.toPublicUser()` para serializar usuário.
- ❌ Afrouxar a CSP com `'unsafe-inline'` para "resolver" um script inline.
  Mova o script para arquivo.
- ❌ Aceitar token por query string (`?token=...`) — vaza em log e `Referer`.
- ❌ Interpolar dado do banco em HTML sem `escapeHtml()`, nem usar `<%- %>`
  do EJS com conteúdo de usuário.
- ❌ Montar `RegExp` a partir de entrada do usuário sem escapar metacaracteres.
- ❌ Logar senha, token, hash ou PII.
- ❌ Commitar `.env`, ou pôr valor real em `.env.example`.
- ❌ Remover `sanitizeInput`, `csrfGuard` ou os rate limiters "porque atrapalha
  o teste manual". Eles já são desligados sozinhos em `NODE_ENV=test`.
- ❌ Rebaixar/desativar o último admin ativo — há invariante e teste para isso.

## Fluxos comuns

### Adicionar um recurso de domínio

1. `models/<recurso>.model.js` — schema + índices necessários.
2. `schemas/<recurso>.schemas.js` — Zod de entrada.
3. `services/<recurso>Service.js` — regra de negócio, recebendo `userId`
   explicitamente e escopando toda query por ele.
4. `controllers/<recurso>.controller.js` — parse, chama service, responde.
5. `routes/<recurso>.routes.js` — `auth` + `requireRole` + `validate`.
6. Registrar em `routes/index.js`.
7. Teste em `tests/<recurso>.test.js`.

### Adicionar uma página

1. Rota em `routes/pages.routes.js` com `pageAuth` + `requirePasswordChanged`
   (+ `requirePageRole` se restrita).
2. View em `views/`, incluindo os partials de header/footer.
3. JS em `public/js/<pagina>.js`, referenciado via `pageScript` no footer.

### Adicionar um papel

`role` é um enum em `models/user.model.js` **e** em
`schemas/admin.schemas.js`. Os dois precisam mudar juntos, mais os guards de
rota afetados.

## Comandos

```bash
cd app
npm install
npm test              # Jest + Mongo em memória
npm run dev           # watch em http://localhost:5000
docker compose up --build
docker compose logs -f app
```

## Checklist de PR

- [ ] `npm test` verde (inclusive os testes novos).
- [ ] Schema Zod em toda entrada nova.
- [ ] `auth` + `requireRole` corretos nas rotas novas.
- [ ] `escapeHtml()` em toda saída user-facing.
- [ ] Sem segredo no código; `.env.example` atualizado se surgiu variável nova.
- [ ] README/SECURITY atualizados se o comportamento de segurança mudou.
- [ ] Sem log de PII, senha ou token.
