# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/);
versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

## [0.2.0]

### Adicionado

- **Quadro de tarefas (Kanban)** com colunas por status, colunas com altura
  fixa e scroll individual, e **arrastar-e-soltar** entre colunas (altera o
  status via PATCH). Cartões com metadados de projeto/responsável/tags.
- **Tarefa rica**: campos `dataInicio`, `horario`, `prazo`, `arquivos[]`,
  `links[]` e `comentarios[]` (thread por autor). Modal de detalhe amplo
  (880px) e reformulado, com render de Markdown + LaTeX (KaTeX), badge de
  status colorido e seções de arquivos/links/comentários.
- **Profissionais** (`Professional`): CRUD validado (Zod), escopo por usuário,
  tabela de domínio e edição via modal.
- **Painel de controle**: gráfico de barras SVG colorido por status, filtros
  por status/dimensão, meta semanal e timer Pomodoro (foco acumulado).
- Schemas Zod (`taskCreate`/`taskUpdate`) agora aceitam os novos campos
  (`dataInicio`, `horario`, `arquivos`, `links`, `comentarios`).
- Documentação: `docs/deploy.md` (deploy em produção) e `TEMPLATE.md`
  (o que remover para usar só o núcleo de autenticação/segurança).
- Seed de demonstração **massivo** por padrão (~3000 tarefas, 400 projetos,
  300 itens, 200 usuários) — ajustável em `server.js`.

### Alterado

- Modal de tarefa/edição redesenhado com tokens de `DESIGN.md`.
- Colunas do quadro com cor de fundo por status (`color-mix`).
- `desenvolvedor`-fix no `README.md` e contagem de testes atualizada.

### Segurança

- Mantidas todas as proteções (bcrypt cost 12, lockout, CSP sem `unsafe-inline`,
  `csrfGuard`, `sanitizeInput`, rate limit, CORS por allowlist,
  `tokenValidAfter`). Serialização de usuário (`toPublicUser`) continua a nunca
  expor `passwordHash`, token ou hash.

## [Não lançado]

### Adicionado

- Mapeamento de respostas HTTP: página `/status` (tabela filtrável por `?q=`),
  API `GET /api/status/:code` (JSON estruturado, 404 se não mapeado) e página
  de erro rericada (código grande, título amigável, ação de recuperação, botão
  Voltar e detalhes de validação). Catálogo centralizado em `HTTP_CATALOG`/
  `ERROR_CATALOG`; suíte sobe de 44 para 50 testes.
- Botão "Carregar dados de demonstração" no dashboard (fora de produção):
  popula ~30 usuários, ~40 projetos e ~120 itens de catálogo via
  `POST /api/demo/load` (bloqueado em `NODE_ENV=production`). Novos domínios
  `Project`/`CatalogItem` com CRUD validado (Zod), escopo por usuário e views
  `/projetos` + `/catalogo`. Suíte sobe de 50 para 60 testes.
- Três bancos físicos isolados numa só aplicação (produção `app_db`, teste
  `app_test_db`, demo `app_demo_db`), acessados por prefixo de rota (`/app`,
  `/test`, `/demo`) e por `connection.useDb`. Models registrados por
  connection num registry (`models/registry.js`); JWT carrega o `mode` no
  payload e o `auth` isola os bancos (token de demo não abre produção).
  Landing pública (`/`) com três botões; `/demo/start` autologa num usuário
  demo. Senha do admin lida de `SEED_PASSWORD_FILE`
  (`~/Documentos/comum/senhas-projetos.md`, não versionado, compartilhado entre
  projetos) com default para esse caminho quando `SEED_PASSWORD_FILE` não está
  definido. Suíte mantida em 60 testes.
- `DESIGN.md`: sistema visual em tokens no formato DESIGN.md (Google), com
  exports `tailwind.theme.json` e `tokens.json`. Lint oficial sem erros nem
  avisos; contrastes de texto verificados contra WCAG AA.

## [0.1.0]

### Adicionado

- Autenticação JWT HS256 via cookie `httpOnly` ou header `Bearer`.
- Papéis `admin` e `user` com guards de API (`requireRole`) e de página
  (`requirePageRole`).
- Registro controlado por administrador: `POST /api/admin/users` gera senha
  temporária exibida uma única vez; conta nasce com `mustChangePassword`.
- Fluxos de troca de senha, esquecimento e redefinição por token com hash
  SHA-256 e expiração via TTL index.
- Lockout de conta (3 tentativas / 30 min) e rate limit por IP.
- `AuditLog` com retenção de 180 dias para eventos sensíveis.
- Endurecimento: Helmet com CSP sem `unsafe-inline`, `csrfGuard`,
  `sanitizeInput` (anti-injeção NoSQL), CORS por allowlist, limite de corpo.
- Views EJS (landing, login, recuperação, primeiro acesso, painel, perfil,
  administração de usuários) sem etapa de build.
- Suíte Jest + Supertest com Mongo em memória (20 testes).
- Docker Compose com app não-root, `read_only` e healthcheck; CI no GitHub
  Actions rodando testes e `npm audit`.

### Segurança

- Corrigida a comparação de `iat` (segundos) com `tokenValidAfter`
  (milissegundos), que invalidava tokens legítimos emitidos no mesmo segundo.
