# Usando este repositório como *template* de projeto

Este repositório é um **template** de aplicação web com foco em **segurança de
autenticação**: login JWT (cookie `httpOnly` ou Bearer), papéis `admin`/`user`,
registro controlado por administrador e as proteções de segurança já ligadas por
padrão (bcrypt cost 12, lockout, CSP sem `unsafe-inline`, `csrfGuard`,
`sanitizeInput`, rate limit, CORS por allowlist, `tokenValidAfter`).

Se o seu objetivo é **apenas o núcleo profissional de login + serialização
segura + rotas de API + token guardado**, siga este roteiro para descaracterizar
o template e remover o domínio de demonstração (quadro de tarefas, catálogo,
painel Pomodoro, landing com botão "Demo").

> Princípio: remova o que é *domínio de exemplo*, **mantenha** tudo que é
> *infraestrutura de segurança*.

## O que MANTER (núcleo de segurança)

- `app/src/middleware/auth.js` — emissão/verificação de JWT, invalidação por
  `tokenValidAfter`, isolamento por `mode` (produção/teste/demo).
- `app/src/middleware/csrfGuard.js`, `sanitizeInput.js`, `rateLimiters.js`,
  `requireRole.js`, `pageAuth.js`, `errorHandler.js`.
- `app/src/utils/` — `AppError`, `validation` (Zod + `asyncHandler`), `audit`.
- `app/src/models/user.model.js`, `auditLog.model.js` — schema de usuário com
  `passwordHash` (`select:false`), lockout e reset por token.
- `app/src/services/authService.js`, `userService.js`, `password.service.js`.
- `app/src/controllers/auth.controller.js`, `admin.controller.js` (registro
  controlado), `profile.controller.js`, `password.controller.js`.
- `app/src/routes/auth.routes.js`, `admin.routes.js`, `pages.routes.js`
  (login/perfil/recuperação), `meta.routes.js` (se quiser manter metas).
- `app/src/seeds/admin.seed.js` — cria o admin inicial.
- `app/src/config/` — `env.js` (validação de ambiente), `db.js`, `i18n.js`,
  `landingContent.js` (se mantiver a landing).
- `app/views/` de autenticação: `login.ejs`, `forgot-password.ejs`,
  `reset-password.ejs`, `primeiro-acesso.ejs`, `perfil.ejs`, `partials/*`,
  `error.ejs`.
- `app/public/css/main.css` (tokens de `DESIGN.md`), `app/public/js/common.js`
  (tema, idioma, fetch com CSRF).
- `DESIGN.md`, `SECURITY.md`, `AGENTS.md`, `CLAUDE.md`, o `docker-compose.yml`
  e o `Dockerfile`.
- `app/tests/auth.test.js`, `admin.test.js`, `seed.test.js`, `config.test.js`
  (cobrem o núcleo de segurança).

## O que REMOVER (domínio de exemplo)

1. **Domínio de tarefas (quadro):**
   - Models: `app/src/models/task.model.js`, `project.model.js`,
     `professional.model.js`, `catalogItem.model.js`.
   - Services: `taskService.js`, `projectService.js`,
     `professionalService.js`, `catalogService.js`, `demoService.js`.
   - Controllers: `task.controller.js`, `project.controller.js`,
     `professional.controller.js`, `catalog.controller.js`, `demo.controller.js`.
   - Routes: `task.routes.js`, `project.routes.js`, `professional.routes.js`,
     `catalog.routes.js`, `demo.routes.js`, `demoLogin.routes.js`,
     `meta.routes.js` (se não quiser metas).
   - Views: `board.ejs`, `projetos.ejs`, `profissionais.ejs`, `painel.ejs`,
     `catalogo.ejs`.
   - JS: `board.js`, `projetos.js`, `profissionais.js`, `painel.js`,
     `catalogo.js`.
   - Schemas: remover os schemas de domínio em `app/src/schemas/demo.schemas.js`
     (manter apenas os de autenticação/admin se houver).
   - Navbar: em `views/partials/header.ejs`, remova os links *Tarefas*,
     *Projetos*, *Profissionais*, *Painel*, *Catálogo*.

2. **Landing com botão "Demo":**
   - Em `app/src/routes/landing.routes.js` e `views/landing.ejs`, remova o
     bloco de demonstração e o `/demo/start`.
   - Em `app/src/server.js`, remova a chamada `carregarDemo(...)` no seed.

3. **Seed de demonstração:**
   - Delete `app/src/services/demoService.js` e a referência em `server.js`.
   - `seedAdminIfEmpty` continua criando só o admin — mantenha.

4. **Testes de domínio:**
   - Delete `app/tests/task.test.js`, `project.test.js`, `professional.test.js`,
     `catalog.test.js`, `meta.test.js`, `paginas.test.js`, `demo.test.js`.

5. **Scripts e docs de domínio:**
   - `app/scripts/seed-carga.js` (teste de carga do demo), `docs/load-testing.md`,
     `docs/architecture.md` (se referir só ao domínio).

## Pós-remoção (verificações)

- `npm test` deve passar com apenas os testes de auth/admin/seed/config.
- `npm run dev` abre o login; `/demo/*` retorna 404.
- `npm audit --audit-level=high` sem vulnerabilidades altas.
- `npx -y @google/design.md lint DESIGN.md` sem erros.
- Confirme que nenhum endpoint expõe `passwordHash`, token ou hash (o
  `authService.toPublicUser()` garante isso — mantenha-o).

## Customizando para o seu projeto

1. `app/package.json`: `name`, `description`, versão inicial `0.1.0`.
2. `.env.example` / `docker-compose.yml`: nome do banco e `APP_NAME`.
3. Papéis: ajuste o enum em `models/user.model.js` e em
   `schemas/admin.schemas.js` (os dois juntos).
4. Adicione seu domínio novo respeitando **Rota → Controller → Service →
   Model**, com Zod em toda entrada e `userId` explícito no service.
5. Registre rotas em `routes/index.js` e teste em `tests/`.
