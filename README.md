# Projeto Profissional — Template Base

Template minimalista e endurecido para iniciar um repositório novo: autenticação
com JWT, dois papéis (`admin` / `user`), **registro controlado por administrador**
(sem autocadastro) e as proteções de segurança já ligadas por padrão.

Serve como *first commit* de qualquer projeto web Node: clone, renomeie, comece
a adicionar o domínio.

## Stack

| Camada    | Tecnologia                          |
|-----------|-------------------------------------|
| Backend   | Node.js 20 + Express                |
| Banco     | MongoDB + Mongoose                  |
| Frontend  | EJS (SSR) + JS vanilla, sem build    |
| Auth      | JWT HS256 — cookie httpOnly ou Bearer |
| Validação | Zod                                 |
| Testes    | Jest + Supertest + mongodb-memory-server |
| Deploy    | Docker Compose (app não-root, read-only) |

## Início rápido

```bash
git clone <seu-repo> && cd <seu-repo>
cp .env.example .env
# gere um secret:  openssl rand -base64 48   -> cole em JWT_SECRET

cd app && npm install
npm test          # 60 testes
npm run dev       # http://localhost:4447
```

No primeiro boot, se não houver nenhum admin no banco, o sistema cria um com
`admin@admin.com`. A senha vem, **por padrão**, do documento compartilhado
`~/Documentos/comum/senhas-projetos.md` (arquivo local, não versionado, comum a
todos os projetos derivados). Se o arquivo não existir, gera uma senha aleatória
e imprime **uma única vez** no log — guarde-a naquele momento.

Com Docker:

```bash
JWT_SECRET=$(openssl rand -base64 48) docker compose up --build
```

## Dois bancos: teste e produção

O template sobe **sempre dois bancos isolados**, nunca compartilhando dados:

| | Produção (`docker-compose.yml`) | Teste/Carga (`docker-compose.test.yml`, `-p pp-test`) |
|---|---|---|
| Banco | `app_db` (volume persistente) | `app_test_db` (`tmpfs`, descartável) |
| População | **Só o admin** `admin@admin.com` | admin + **usuários demo** (Ana, Bruno, Carla, Diego) |
| Acesso a dados | você insere pela interface | reconfigurável a qualquer momento |
| Rate limit | ativo | desativado (`RATE_LIMIT_DISABLED`) |
| `NODE_ENV` | `production` | `staging` |

A produção **nunca** recebe dados de demonstração — ela parte vazia (só o admin)
e você popula via interface. O banco de teste já nasce populado para inspeção
visual e testes de carga. Para subir os dois juntos:

```bash
docker compose up -d --build                       # producao :4447
docker compose -f docker-compose.test.yml -p pp-test up -d --build   # teste :4446
```

## Seed de dados

- `app/src/seeds/admin.seed.js` — `seedAdminIfEmpty({ populaDemo })`:
  cria `admin@admin.com` se não houver admin; com `populaDemo` (tudo que não é
  `production`) insere usuários sintéticos. `NODE_ENV=production` nunca popula
  demo.
- A senha do admin vem de `SEED_PASSWORD_FILE` (default
  `~/Documentos/comum/senhas-projetos.md`); o arquivo é lido por
  `resolverSenhaAdmin()` e **não é versionado**.
- `app/scripts/seed-carga.js [n]` — semeia `n` usuários para o teste de carga
  (só banco de teste; recusa produção).

## Dados de demonstração (botão "Carregar demo")

No dashboard (`/app`), fora de produção, há um botão **Carregar dados de
demonstração** que popula o banco com um conjunto completo para explorar todas
as telas: dezenas de usuários, projetos e itens de catálogo. O backend bloqueia
esse endpoint (`POST /api/demo/load`) em `NODE_ENV=production`.

O que é carregado (via `demoService.carregarDemo`):

- **Usuários** (`@example.com`): ~30, com papéis `admin`/`user` variados, todos
  com a senha compartilhada do arquivo.
- **Projetos**: ~40, com status, tags e dono (exercita listagem, filtro, escopo
  por usuário e detalhe).
- **Catálogo**: ~120 itens com SKU, categoria, preço e estoque (exercita
  listagem, busca `$text`, paginação e filtro).

Telas de exploração: `/projetos` (filtro por status/tag + paginação) e
`/catalogo` (busca + filtro de categoria). Ambas consomem as APIs
`/api/projects` e `/api/catalog`, validadas com Zod. O botão "Recarregar do
zero" apaga e repopula (`force=true`).
app/src/
  config/      env.js (validação de ambiente), db.js
  models/      Mongoose schemas (user, auditLog, project, catalogItem)
  services/    regra de negócio (authService, userService)
  controllers/ handlers de rota (req -> service -> res)
  routes/      mapeamento de endpoints
  middleware/  auth, pageAuth, requireRole, csrfGuard, sanitizeInput,
               rateLimiters, errorHandler
  schemas/     validação Zod
  seeds/       admin.seed.js
  utils/       AppError, validation, audit
app/views/     EJS
app/public/    css/ e js/ (sem bundler)
app/tests/     Jest + Supertest
```

Fluxo obrigatório: **Rota → Controller → Service → Model**. A regra de negócio
mora no service; o controller só traduz HTTP.

## Endpoints

| Método | Rota                                  | Acesso  |
|--------|---------------------------------------|---------|
| POST   | `/api/auth/login`                     | público (rate-limited) |
| POST   | `/api/auth/logout`                    | público |
| GET    | `/api/auth/me`                        | autenticado |
| PATCH  | `/api/auth/me`                        | autenticado |
| POST   | `/api/auth/change-password`           | autenticado |
| POST   | `/api/auth/forgot-password`           | público (rate-limited) |
| POST   | `/api/auth/reset-password`            | público (rate-limited) |
| GET    | `/api/admin/users`                    | admin   |
| POST   | `/api/admin/users`                    | admin   |
| PATCH  | `/api/admin/users/:id`                | admin   |
| POST   | `/api/admin/users/:id/reset-password` | admin   |
| GET    | `/api/health/{live,ready}`            | público |

Páginas: `/`, `/login`, `/forgot-password`, `/reset-password`,
`/primeiro-acesso`, `/app`, `/perfil`, `/admin` e `/status`.

### Mapeamento de respostas HTTP (`/status`)

Catálogo legível de todos os status devolvidos pela aplicação — usado
internamente e pelo suporte.

- **Página** `GET /status` — tabela com código, nome, classe
  (sucesso / redirecionamento / erro do cliente / erro do servidor), se é
  reenviável e a descrição. Filtre por código, nome ou descrição com
  `?q=timeout`.
- **API** `GET /api/status/:code` — JSON estruturado (`{ code, name, kind,
  retryable, desc }`); retorna `404` se o código não estiver mapeado.

As mensagens de erro renderizadas (`views/error.ejs`) usam o mesmo catálogo
(`ERROR_CATALOG` em `src/middleware/errorHandler.js`): título amigável, ação de
recuperação, detalhes de validação e botão **Voltar** (aponte para o `Referer`
same-origin, nunca `javascript:` — a CSP proíbe script inline). Para adicionar
um status novo, basta acrescentar a entrada em `HTTP_CATALOG` (e em
`ERROR_CATALOG` se for erro); não há `if`s espalhados pelo handler.

## Modelo de dados

**User** — `role` (`admin`|`user`), `name`, `email` (único, lowercase),
`passwordHash` (bcrypt cost 12, `select:false`), `isActive`,
`mustChangePassword`, `tokenValidAfter` (invalidação global de sessão),
`failedLoginAttempts` + `lockedUntil` (lockout), `passwordResetTokenHash` +
`passwordResetExpires` (TTL index), `lastLoginAt`, timestamps.

**AuditLog** — `action` (enum fechado), `actorId`, `targetId`, `ip`,
`userAgent`, `meta`, `createdAt` com TTL de 180 dias. Nunca guarda senha,
token ou hash.

## Segurança embutida

- Bcrypt cost 12; hash nunca sai em nenhuma resposta (`select:false`).
- Senha mínima: 12 caracteres com maiúscula, minúscula e dígito.
- Lockout: 3 tentativas → 30 min de bloqueio.
- Comparação em tempo constante contra hash dummy quando o e-mail não existe
  (anti-enumeração por timing); `/forgot-password` responde igual sempre.
- Cookie `httpOnly` + `SameSite=Lax` + `Secure` automático em HTTPS.
- `csrfGuard`: valida Origin/Referer em mutações autenticadas por cookie.
- `sanitizeInput`: remove chaves `$`/`.` (injeção NoSQL), corta profundidade.
- Helmet com CSP restritiva — **sem `unsafe-inline`**: todo JS fica em arquivo.
- Rate limit: 300 req/5 min na API, 3 tentativas/30 min em login/reset.
- CORS por allowlist explícita, nunca `*`.
- Corpo limitado a 100 kB; `x-powered-by` desligado.
- `tokenValidAfter` derruba todas as sessões ao trocar senha ou desativar conta.
- Erro 500 nunca vaza stack nem mensagem crua.
- Container: usuário não-root, `read_only`, `no-new-privileges`, healthcheck.

Detalhes e processo de reporte: [SECURITY.md](SECURITY.md).

## Testes

Suíte com **60 testes** (Jest + Supertest) contra um MongoDB real em memória —
sem mock de banco.

```bash
cd app
npm test                      # suíte completa (~10 s)
npm run test:watch            # re-executa ao salvar
npm test -- auth.test.js      # um arquivo
npm run test:coverage         # cobertura
```

Documentação completa: [docs/testing.md](docs/testing.md).

## Teste de carga

Stack de teste isolada (banco próprio, descartável) e cenário k6 dockerizado.

```bash
docker compose -f docker-compose.test.yml -p pp-test up -d --build
docker compose -f docker-compose.test.yml -p pp-test exec -T app-test node scripts/seed-carga.js 50
docker compose -f docker-compose.test.yml -p pp-test --profile carga \
  run --rm -e PERFIL=carga -e CARGA_VUS=100 k6 run /scripts/carga.js
```

Resultados medidos em Intel i5-9400F (6 núcleos), 1 instância:

| Carga | Erros | Vazão | Leitura p95 | Situação |
|---|---|---|---|---|
| 100 VUs | 0,00% | 214 req/s | 287 ms | Todos os limiares aprovados |
| 200 VUs | 0,00% | 262 req/s | 989 ms | Sem erros, latência acima da meta |

O gargalo é o login (bcrypt custo 12, limitado por CPU): ~4,5 logins/s por
instância. A aplicação é *stateless*, então escala horizontalmente.

Metodologia, perfis (`smoke`, `carga`, `estresse`, `pico`, `auth`) e análise:
[docs/load-testing.md](docs/load-testing.md).

## Ambientes

| | Produção | Teste / carga |
|---|---|---|
| Arquivo | `docker-compose.yml` | `docker-compose.test.yml` |
| Projeto | `pp` | `pp-test` |
| Banco | `app_db`, volume persistente | `app_test_db`, `tmpfs` descartável |
| Porta | `127.0.0.1:4447` | `127.0.0.1:4446` |
| Limitação de taxa | Ativa | Desativada |

As duas podem rodar ao mesmo tempo, em redes Docker separadas.

### Acesso de outra máquina

Por padrão o Docker publica só em `127.0.0.1` — de outro host a página não
abre (e o log da aplicação não acusa nada, porque o pacote nunca chega).
Defina `BIND_ADDR` no `.env` com a interface desejada:

```bash
BIND_ADDR=100.120.54.126          # IP da VPN/Tailscale
APP_BASE_URL=http://100.120.54.126:4447
COOKIE_SECURE=false               # obrigatório em HTTP puro
```

`BIND_ADDR=0.0.0.0` expõe em todas as interfaces — só com firewall na frente.

## Documentação

- [docs/architecture.md](docs/architecture.md) — camadas e fluxo de requisição
- [docs/testing.md](docs/testing.md) — suíte npm, como escrever testes
- [docs/load-testing.md](docs/load-testing.md) — capacidade medida
- [docs/deployment.md](docs/deployment.md) — deploy, proxy reverso, backup
- [DESIGN.md](DESIGN.md) — sistema visual em tokens (spec DESIGN.md do Google):
  paleta, tipografia, elevação, componentes e as regras de acessibilidade.
  Valide com `npx -y @google/design.md lint DESIGN.md`.
- [SECURITY.md](SECURITY.md) — arquitetura de segurança
- [AGENTS.md](AGENTS.md) — instruções para agentes de código

## Adaptar para um projeto novo

1. `app/package.json`: `name` e `description`.
2. `.env.example` / `docker-compose.yml`: nome do banco e `APP_NAME`.
3. Views: marca em `views/partials/header.ejs` e `views/landing.ejs`.
4. Papéis: ajuste o enum em `models/user.model.js` e `schemas/admin.schemas.js`.
5. Domínio: novo model → service → controller → routes, registrado em
   `routes/index.js`. Teste em `tests/`.

## Desenvolvimento

Fluxo de trabalho recomendado para evoluir este template (vale para qualquer
projeto derivado):

```bash
# 1. branch a partir de main, nome por tipo (feat/fix/docs/chore/refactor/test)
git switch -c feat/mapeamento-http main

# 2. .env local (gitignored) + instalação
cp .env.example .env            # JWT_SECRET=$(openssl rand -base64 48)
cd app && npm install

# 3. loop desenvolver → testar → verificar
npm run dev                     # http://localhost:4447
npm test                       # suíte Jest (Mongo em memória)
npm run test:watch             # reexecuta ao salvar
npm run test:coverage          # cobertura

# 4. antes de commitar: lint de design/contraste e audit de dependências
npx -y @google/design.md lint DESIGN.md
npm audit --audit-level=high
```

### Arquitetura em camadas

Sempre: **Rota → Controller → Service → Model**. O service nunca recebe `req`;
recebe dados validados + `userId` explícitos. Validação de entrada obrigatória
com Zod (`validate(schema)`) em todo POST/PUT/PATCH. Erros esperados usam
`AppError(msg, status)`; o `errorHandler` é o único lugar que formata a resposta.
Detalhes completos em [AGENTS.md](AGENTS.md) e [docs/architecture.md](docs/architecture.md).

### Convenções de commit

[Padrão Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nova funcionalidade (incrementa MINOR)
- `fix:` correção de bug (incrementa PATCH)
- `docs:` documentação · `refactor:` sem mudança de comportamento
- `test:` testes · `chore:` manutenção (deps, CI)

Ex.: `feat: adiciona mapeamento de respostas HTTP` · `fix: corrige comparação de iat`.

## Documentação

Este repositório documenta a si mesmo em várias camadas — mantenha todas ao
alterar o código. Documentação desatualizada conta como déficit de PR.

| Arquivo | Conteúdo | Quando atualizar |
|---|---|---|
| `README.md` | Visão geral, stack, endpoints, como rodar | a cada feature/endpoint novo |
| `AGENTS.md` | Instruções para agentes de código | ao mudar arquitetura/regras |
| `CLAUDE.md` | Mesma função do AGENTS (público) | junto com AGENTS |
| `CONTRIBUTING.md` | Como contribuir | ao mudar o fluxo de PR |
| `SECURITY.md` | Modelo de ameaças e reporte | ao mudar segurança |
| `CHANGELOG.md` | Histórico por versão (Keep a Changelog) | a cada merge em `main` |
| `DESIGN.md` | Sistema visual em tokens | ao tocar em CSS/cores |
| `docs/*.md` | Arquitetura, testes, carga, deploy | ao mudar o respectivo tópico |

Regras práticas:

- **Números são sagrados.** Qualquer métrica na interface ou na doc
  (req/s, % de erro, ms de latência, nº de testes) tem de vir de medição real.
  Não publique número não verificado — propaga a correção para todos os arquivos.
- **CSP govera a view.** Nada de `<script>` inline; todo JS em `public/js/`,
  referenciado por `pageScript`. Documente o comportamento, não o código.
- **DESIGN.md é a fonte de tokens.** Antes de criar uma cor/cinza novo em
  `main.css`, meça o contraste (WCAG AA) e, se aprovado, adicione ao token —
  não repita hex solto na view.
- **CHANGELOG é humano.** Agrupe por *Adicionado / Alterado / Corrigido /
  Segurança*; referencie o PR quando possível.

## Licença

MIT — veja [LICENSE](LICENSE).
