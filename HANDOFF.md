# Handoff — Projeto Profissional (template)

> Atualizado por Hermes Agent em 08/08/2026 às ~22h. Estado pós-recuperação de
> trabalho perdido em resets acidentais.

## Estado atual (08/08/2026)

- **Branch `main`** = commit `d955330` ("recupera trabalho da sessao: landing,
  profissionais, DESIGN, project ctrl/svc, header/footer"). Este commit contém
  TODO o trabalho da sessão do usuário (08/08) + o board (dificuldade Fibonacci,
  Pomodoro por tarefa, painel, filtros recolhíveis, datalist) que já estavam no
  repositório antes da sessão.
- Trabalho da sessão recuperado de um **stash** (`wip-nao-relacionado-pre-reset`)
  que havia sido apagado por `git reset --hard` acidentais. Commit consolidado em
  `d955330`.
- **Servidor de dev**: sobe limpo na porta 4450 (instância única, 3 bancos:
  app_db / app_test_db / app_demo_db). Sem erros no boot.
- **Checkpoints de segurança** (não apagar sem confirmação):
  - branch local `backup/main-pre-revert` = `812d269`
  - commit órfão `00f9fa7` (cópia do stash como commit)

## O que tem no repo (estrutura real)

```
app/src/
  config/      env.js, db.js, landingContent.js, i18n.js
  models/      user, auditLog, project, catalogItem, task, professional, meta
               registry.js  (registra User/AuditLog/Project/CatalogItem/Task/
                            Professional/Meta por connection)
  services/    authService, projectService, taskService, demoService, catalogService
  controllers/ auth, project, task, professional, meta, catalog, demo, admin
  routes/      index, pages, api (task/project/professional/meta/catalog/auth/
               demo), landing, demoLogin, status
  middleware/  auth, pageAuth, requireRole, csrfGuard, sanitizeInput,
               rateLimiters, selectDb, errorHandler
  schemas/     (Zod) task, project, professional, meta, admin, auth
  seeds/       admin.seed.js
  utils/       AppError, validation, audit
  views/       16 .ejs (board, painel, projetos, profissionais, catalogo, landing,
               login, perfil, status, admin/usuarios, partials/header+footer, ...)
  public/js/   board, painel, projetos, profissionais, catalogo, login,
               dashboard, calendario, common, forgot-password, admin-usuarios
  public/css/  main.css, theme-space.css
  tests/       task, demo, paginas (Jest + Supertest + mongo-memory)
```

## Decisões de arquitetura importantes (não reverter sem falar)

1. **3 bancos isolados** por connection: `production` / `test` / `demo`. O seed
   demo popula ~31 users, 40 projetos, 3000 tarefas, 60 profissionais, 31 metas.
   Acessível via `/demo/*` (autologa em usuário demo).
2. **Task** tem: `titulo`, `status` (planejado/em_andamento/pausado/concluido),
   `projetoId`, `profissionalId`, `responsavelId`, `dificuldade` (Fibonacci),
   `minutosFoco`, `entregueEm`, `tags`, `comentarios`, `arquivos`, `links`,
   `ownerId`. API: `POST /api/:modo/tasks/:id/foco` acumula foco; marcar
   `concluido` seta `entregueEm`.
3. **Professional** e **Meta** são models próprios (não embutidos em User).
   `Meta` guarda metas de foco semanal por dono (gráficos do painel).
4. **Landíndice** (`landingContent.js`) e views `landing.ejs`/`header.ejs`/`footer.ejs`
   foram reescritos na sessão 08/08 — respeitar antes de alterar.
5. **DESIGN.md** atualizado na sessão (tokens de cor/tipografia do tema
   space/glass). Rodar `npx -y @google/design.md lint DESIGN.md` após mudanças.

## Como rodar (dev)

```bash
cd app
npm install
# precisa de MongoDB. Usar o container docker em 192.168.112.3:27017 (ou ajustar MONGO_URI)
export MONGO_URI="mongodb://192.168.112.3:27017/app_db"
export PORT=4450 JWT_SECRET="dev-secret-mudar-em-prod-32caracteres!!" SEED_PASSWORD="AdminDemo123!"
export NODE_ENV=development
node src/server.js
# demo: http://localhost:4450/demo/start  (redireciona e autologa)
npm test   # Jest + mongo em memória
```

## Verificação rápida (browser)

- `/demo/start` → autologa e cai no board.
- Nav: Tarefas · Painel · Projetos · Profissionais · Perfil.
- Board: filtros recolhíveis (`▸ Filtros`), 4 colunas, cards com Markdown/LaTeX,
  ícones SVG Editar/Remover, "Mover para".
- Painel: gráficos de foco/status/horas (usa `Meta`).

## Próximos passos (Project #15 no GitHub)

Issues abertas mapeadas:
- #20 subtarefas 3 níveis
- #21 Pomodoro completo (aba própria + histórico + música + pausa)
- #22 profissionais → login (conta de acesso)
- #23 Meus Projetos + SWOT/PDCA
- #24 bug: ícones SVG não renderizam em botões de tabela (Projetos/Profissionais)
- #25 bug: servidor zumbi de sessão anterior compete a porta 4450
- #27 responsável digitável (datalist) readequado à base owner/assignee

## Lições (não repetir)

- ❌ NUNCA `git reset --hard` / `git checkout --` sem antes `git stash` ou
  `git diff` do working tree. O usuário tinha trabalho não commitado que foi
  apagado e só foi recuperado por sorte (stash + commit órfão).
- ❌ NUNCA `git push -f` para `main` sem confirmar o commit exato com o usuário
  e sem ter um branch de backup.
- ✅ Antes de qualquer reset/force, criar `backup/<nome>` apontando para HEAD.
- ✅ Recuperação de trabalho perdido: `git fsck --lost-found`, `git stash list`,
  `git reflog` — stash e dangling commits salvam.
