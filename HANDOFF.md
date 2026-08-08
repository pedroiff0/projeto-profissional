# Handoff — Projeto Profissional (template)

> Atualizado por Hermes Agent em 08/08/2026. Estado pós-refatoração do task
> manager (#14–#17) e início das features de produtividade (dificuldade
> Fibonacci, Pomodoro por tarefa, Entregue em).

## O que é

Template base de aplicação web (Node 20 + Express + MongoDB/Mongoose + EJS +
Bootstrap 5 + tema deep-space/glass). O "sistema" é um task manager estilo
Asana/Trello com board, e está evoluindo para incluir Pomodoro, dificuldade e
relatório de horas.

## Decisão de arquitetura (conflito resolvido)

Houve divergência entre duas versões de `Task`:
- **Versão antiga (minha)**: `titulo`, `status: planejado|em_andamento|pausado|concluido`,
  `projetoId`, `profissionalId`, `responsavelId` (em Project), e um `Meta` por dono.
- **Remote (#14–#17)**: `title`, `status: todo|doing|done`, `dueDate`, `ownerId`/`ownerName`,
  `assigneeId`/`assigneeName`. **Removeu** `projectId` da Task e `responsavelId` do Project.

**Decisão (opção A, escolhida pelo usuário):** assumir a base do remote como
oficial. Meus commits antigos foram salvos em `wip/versao-pre-remote` (backup)
e o trabalho foi reimplementado sobre `origin/main`. Consequência: "horas por
projeto" e "responsável digitável nos projetos" exigem reaver a vinculação
Task→Project (issue #20/#23) antes de funcionarem.

## Task (estado atual, após `dc333d2`)

`app/src/models/task.model.js`:
- `title`, `description`, `status: todo|doing|done`, `dueDate`,
  `ownerId`/`ownerName`, `assigneeId`/`assigneeName` (do remote).
- **Adicionado (feature):** `dificuldade` (enum Fibonacci `1,2,3,5,8,13,21`,
  opcional), `minutosFoco` (Number, default 0), `entregueEm` (Date, setado ao
  marcar `done`).

Camadas:
- `schemas/task.schemas.js`: `dificuldade` validada no create/update (union dos
  literais Fibonacci; 422 se fora da sequência).
- `services/taskService.js`: `atualizar` seta `entregueEm` ao marcar `done` e
  limpa ao reabrir; novo `registrarFoco(id, minutos, …)` incrementa `minutosFoco`.
- `controllers/task.controller.js` + `routes/task.routes.js`:
  `POST /api/tasks/:id/foco` → `registrarFoco`.

## Como rodar

```bash
cd app && npm install
npm test                              # Jest + Mongo em memória
npm run dev                           # http://localhost:4450

# Docker (produção)
docker compose up --build
```

## Demo (auto-login)

- Landing → "Demo" → `GET /demo/start` autologa como `demo1@example.com`
  (cookie httpOnly) e redireciona para `/demo/`. Acesso direto:
  `http://localhost:4450/demo/start` (ou `http://192.168.0.33:4450/demo/start`
  na rede local).
- Senha dos usuários demo (e admin): vem de `SEED_PASSWORD_FILE`
  (`AdminComum123!!` nos testes). Em produção, do arquivo compartilhado.
- Rotas de teste em `/api/test/*` (tasks, auth/login) usadas pela suíte Jest.

## Endpoints úteis

- `GET  /api/{modo}/tasks`
- `POST /api/{modo}/tasks`  (Zod; `dificuldade` opcional Fibonacci)
- `PATCH/DELETE /api/{modo}/tasks/:id`
- `POST /api/{modo}/tasks/:id/foco`  → `{ minutos }` registra foco na tarefa
- `GET  /api/health/ready` → 200 se o banco está conectado

## Issues / Project

- **Project:** "Projeto Profissional — Roadmap" (#15) no GitHub — todas as
  issues abaixo estão nele.
- Features: #18 filtros/responsável, #19 Entregue em, #20 subtarefas 3 níveis,
  #21 Pomodoro completo (aba + histórico), #22 profissionais→login, #23 Meus
  Projetos + SWOT/PDCA.
- Bugs: #24 ícones SVG nos botões de tabela, #25 servidor zumbi na 4450.
- Melhorias: #26 testes Jest (RESOLVIDA via PR #29), #27 responsável datalist
  readequado, #28 documentação.

## Commits relevantes (main)

- `dc333d2` feat(task): dificuldade Fibonacci, Pomodoro por tarefa e Entregue em
- `b3dcdc1` fix: contraste da landing + board/calendario (space/glass) (#17)
- `c31340b` feat: tema deep space + glassmorphism (#16)
- `edae8c9` feat: task manager (board + calendario) + landing (#14)

## PRs

- #29 test(task): suite Jest para dificuldade, entregueEm e foco (fecha #26)

## Pendências / próximos passos (ordem sugerida)

1. **UI do board** (fecha #18/#19): badges de dificuldade/foco/"Entregue em"
   nos cards, campo `dificuldade` no formulário, e seção Pomodoro por tarefa.
   O board do remote é Bootstrap 5 + render via JS (`public/js/board.js`).
2. **Painel** (nova view): gráficos de status, dificuldade (donut), horas por
   tarefa/projeto e foco semanal + relatório de horas líquidas.
3. **Reaver Task→Project** (#20/#23): adicionar `projectId` à Task para habilitar
   "responsável digitável", "horas por projeto" e a página individual do projeto.
4. **Subtarefas 3 níveis** (#20), **Pomodoro completo** (#21: pausa, música,
   atribuição, aba própria + histórico de sessões), **profissionais→login** (#22),
   **Meus Projetos + SWOT/PDCA** (#23).
5. **BUG #24**: confirmar se `.icon-btn`/SVG está coerente com o markup Bootstrap
   das tabelas de Projetos/Profissionais.
6. **BUG #25**: documentar limpeza do servidor zumbi (PID orfão em container com
   restart) em `docs/deployment.md`.

## Verificação (ad-hoc)

- Servidor na 4450 no ar (único processo escutando).
- Backend validado por script ad-hoc (server + símbolos + `node --check`):
  14/14 pass.
- Suíte Jest `tests/taskFeatures.test.js`: 3/3 pass (PR #29).
- Validação ponta-a-ponta da UI pendente (exige implementação do item 1).
