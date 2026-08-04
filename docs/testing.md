# Testes

Duas camadas independentes: **testes automatizados** (Jest, rápidos, rodam a
cada mudança) e **teste de carga** (k6, sob demanda — ver
[load-testing.md](load-testing.md)).

## Comandos

```bash
cd app

npm test                      # suíte completa
npm run test:watch            # re-executa ao salvar
npm test -- auth.test.js      # um arquivo
npm test -- -t "login"        # filtra pelo nome do teste
npm test -- --coverage        # relatório de cobertura
```

Estado atual: **20 testes, 3 suítes, todos aprovados** em ~11 s.

## Como a suíte funciona

`NODE_ENV=test` é definido pelo próprio script `npm test`, e isso muda o
comportamento do app de propósito:

- **Limitação de taxa desativada** — a suíte faz dezenas de logins e seria
  bloqueada pelo limite de 3 tentativas/30 min.
- **`csrfGuard` desativado** — o Supertest não é um navegador e não envia
  `Origin`/`Referer`.

Ambos voltam a valer automaticamente fora de `NODE_ENV=test`. Nunca desative
essas proteções por outro caminho.

### Banco de dados

Cada suíte sobe um **MongoDB real em memória** via `mongodb-memory-server`:

```js
beforeAll(setupDb);    // sobe o Mongo em memória e conecta
afterAll(teardownDb);  // derruba tudo
afterEach(clearDb);    // limpa as coleções entre testes
```

Não há mock de banco. Índices únicos, validações do Mongoose, `select: false`
no `passwordHash` e operadores de consulta são exercitados de verdade — é o
que permite que a suíte pegue bugs reais em vez de confirmar suposições.

O download do binário do Mongo acontece uma única vez, no primeiro `npm test`.

### Estrutura

```
app/tests/
  helpers/db.js       setup/teardown/clear do Mongo em memória
  auth.test.js        autenticação (9 testes)
  admin.test.js       administração e registro controlado (6 testes)
  config.test.js      guards de configuração (5 testes)
```

## O que está coberto

### `auth.test.js`

| Teste | Verifica |
|---|---|
| Login válido | 200, cookie `HttpOnly`, `passwordHash` ausente da resposta |
| Senha errada | 401 com mensagem genérica |
| E-mail inexistente | 401 **idêntico** ao anterior (anti-enumeração) |
| 3 tentativas falhas | Conta bloqueada com 429 |
| Injeção NoSQL | `{"$gt": ""}` não autentica |
| Conta inativa | 401 |
| `/me` sem token | 401 |
| `/me` com Bearer | 200 com o usuário correto |

### `admin.test.js`

| Teste | Verifica |
|---|---|
| Usuário comum em rota de admin | 403 |
| Anônimo em rota de admin | 401 |
| Admin cria usuário | 201, senha temporária funciona no login, hash guardado |
| E-mail duplicado | 409 |
| Payload inválido | 422 |
| Admin desativa a si mesmo | 422 (invariante do último admin) |
| Troca de senha | Tokens antigos passam a ser recusados |

### `config.test.js`

Invariantes de ambiente, exercitadas em subprocesso (o `config/env.js` valida
no `require`, e o Jest cacheia módulo):

| Teste | Verifica |
|---|---|
| `RATE_LIMIT_DISABLED=true` + produção | Boot **falha** — não se desliga força bruta por acidente |
| Mesmo flag em staging | Aceito (é o que o teste de carga usa) |
| Produção sem o flag | Limitador ativo por padrão |
| `JWT_SECRET` curto em produção | Boot falha |
| Seed de carga em banco sem "test" no nome | Recusado |

## Escrevendo um teste novo

Todo endpoint precisa de quatro casos no mínimo: caminho feliz, entrada
inválida (422), sem autenticação (401) e sem permissão (403).

```js
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-com-mais-de-32-caracteres-ok!!';

const request = require('supertest');
const { createApp } = require('../src/app');
const { setupDb, teardownDb, clearDb } = require('./helpers/db');
const authService = require('../src/services/authService');
const User = require('../src/models/user.model');

const app = createApp();

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

it('nega acesso sem autenticação', async () => {
  const res = await request(app).get('/api/recurso');
  expect(res.status).toBe(401);
});

it('devolve o recurso para usuário autenticado', async () => {
  const user = await User.create({
    name: 'Fulano',
    email: 'f@example.com',
    role: 'user',
    passwordHash: await authService.hashPassword('SenhaForte123ok'),
  });
  const res = await request(app)
    .get('/api/recurso')
    .set('Authorization', `Bearer ${authService.generateToken(user)}`);
  expect(res.status).toBe(200);
});
```

### Boas práticas

- Autentique com `Bearer` — evita lidar com cookie e `csrfGuard`.
- Crie os dados dentro do teste, nunca em estado global compartilhado.
- Afirme sobre o **comportamento observável** (status, corpo), não sobre
  detalhes internos de implementação.
- Verifique também o que **não** deve aparecer: `expect(res.body.user.passwordHash).toBeUndefined()`.
- Um teste que nunca falhou não prova nada: veja-o falhar antes de dar por pronto.

## Armadilhas conhecidas

1. **`--runInBand` é obrigatório.** Suítes em paralelo competem por porta e
   por instâncias do Mongo em memória. Já está no script.
2. **`--forceExit` é intencional.** O `mongodb-memory-server` às vezes deixa
   um *handle* aberto; sem a flag, o Jest trava no fim.
3. **`passwordHash` tem `select: false`.** Ao comparar senha em código novo,
   use `.select('+passwordHash')`, senão o `bcrypt.compare` recebe `undefined`.
4. **Senha de teste precisa cumprir a política:** mínimo 12 caracteres com
   maiúscula, minúscula e dígito — do contrário o Zod devolve 422 e o teste
   falha por um motivo diferente do pretendido.
5. **`JWT_SECRET` precisa ser definido no topo do arquivo**, antes de
   qualquer `require` que carregue `config/env.js`.
6. **`iat` do JWT é em segundos.** Ao testar invalidação de sessão, empurre
   `tokenValidAfter` para o futuro em vez de confiar no relógio dentro do
   mesmo segundo (ver `admin.test.js`).

## Integração contínua

`.github/workflows/ci.yml` executa em todo *push* e *pull request*:

1. `npm ci` — exige `package-lock.json` versionado.
2. `npm test` — a suíte completa.
3. `npm audit --audit-level=high` — falha em vulnerabilidade alta ou crítica.

O teste de carga tem fluxo próprio, acionado manualmente.

## Cobertura

```bash
npm test -- --coverage
```

Perseguir 100% não é meta. A prioridade é: caminhos de autenticação e
autorização, invariantes de segurança (último admin, revogação de sessão),
validação de entrada e regra de negócio dos serviços. Getter trivial não
precisa de teste.
