# Política de Segurança

## Versões suportadas

Apenas a branch `main` recebe correções de segurança.

## Reportar uma vulnerabilidade

**Não abra issue pública.** Use *Security → Report a vulnerability* (GitHub
Private Vulnerability Reporting) ou envie e-mail ao mantenedor.

Inclua: descrição, passos de reprodução, impacto e versão/commit. Retorno em
até 7 dias; correção coordenada antes de qualquer divulgação.

## Arquitetura de segurança

### Autenticação

- JWT HS256, expiração padrão de 2h (`JWT_EXPIRES_IN`).
- Transporte: cookie `httpOnly` + `SameSite=Lax` (web) ou `Authorization:
  Bearer` (API/mobile). **Token em query string não é aceito** — vazaria em
  logs de proxy e no header `Referer`.
- `JWT_SECRET` obrigatório em produção, mínimo 32 caracteres; o boot falha
  sem ele em vez de cair num default inseguro.
- `tokenValidAfter` no usuário: qualquer token emitido antes desse instante é
  recusado. Atualizado em troca de senha, reset e desativação de conta —
  é o mecanismo de logout global.
  Cuidado: `iat` do JWT é em **segundos** truncados; a comparação normaliza
  os dois lados para segundos. Comparar com milissegundos invalida tokens
  legítimos emitidos no mesmo segundo (bug já corrigido, coberto por teste).

### Senhas

- Bcrypt com cost 12. Nada de SHA/MD5, nada de senha em claro em lugar nenhum.
- `passwordHash` tem `select: false`: nenhuma query devolve o hash por acidente.
- Política: mínimo 12 caracteres, com minúscula, maiúscula e dígito.
- A nova senha precisa ser diferente da atual.
- Senha temporária (criação de conta e reset administrativo): 18 bytes
  aleatórios (~144 bits), exibida **uma única vez** na resposta HTTP, nunca
  persistida em claro nem registrada em log.

### Autorização

1. `auth` (API) — valida o JWT, popula `req.user`, responde 401 em JSON.
2. `pageAuth` (páginas) — mesma validação, redireciona para `/login`.
3. `requireRole('admin')` — sempre **depois** de `auth`.
4. `requirePasswordChanged` — conta provisionada só navega após trocar a senha.

Registro é controlado: não existe endpoint público de cadastro. Só admin cria
contas (`POST /api/admin/users`).

Invariante: sempre deve existir pelo menos um admin ativo. Um admin não pode
rebaixar nem desativar a própria conta, nem a última conta admin ativa.

### Anti-enumeração de contas

- Login sempre responde `Credenciais invalidas` (401) — e-mail inexistente,
  senha errada ou conta inativa são indistinguíveis.
- Quando o usuário não existe, ainda assim é feito um `bcrypt.compare` contra
  um hash dummy, igualando o tempo de resposta.
- `/forgot-password` responde a mesma mensagem exista ou não a conta.

### Força bruta

- Lockout por conta: 3 falhas → 30 minutos bloqueado (429).
- Rate limit por IP: 3 tentativas/30 min em login e reset; 300 req/5 min na API.
- Rate limiters são desligados em `NODE_ENV=test` para não bloquear a suíte.
- Isto não substitui WAF/CDN contra ataque distribuído.

### Injeção

- **NoSQL**: `sanitizeInput` remove chaves iniciadas por `$` ou contendo `.`
  em body/query/params, recursivamente, com limite de profundidade.
  Segunda camada: todo POST/PATCH passa por schema Zod que força o tipo.
- **Regex DoS**: a busca de usuários escapa metacaracteres antes de montar o
  `RegExp`.
- **XSS**: CSP sem `unsafe-inline` (todo JS em arquivo externo); EJS usa
  `<%= %>` (escapado) por padrão; o front escapa qualquer dado do banco com
  `escapeHtml()` antes de `innerHTML`. Nunca use `<%- %>` com dado de usuário.
- **CSRF**: cookie `SameSite=Lax` + `csrfGuard` verificando Origin/Referer em
  mutações autenticadas por cookie. Requisições Bearer não carregam cookie e
  ficam de fora por não serem alvo de CSRF clássico.

### Cabeçalhos e transporte

Helmet com CSP restritiva, `frame-ancestors 'none'`, `object-src 'none'`,
`referrer-policy: same-origin`, `x-powered-by` desligado.

`COOKIE_SECURE` liga sozinho quando `APP_BASE_URL` é `https://`. Em HTTP puro
(LAN/VPN) precisa ficar `false`, senão o navegador descarta o cookie e a
sessão nunca cola — sintoma clássico: login responde 200 e mesmo assim volta
para `/login`.

### Segredos

- Tudo por variável de ambiente; `.env` está no `.gitignore`.
- `.env.example` nunca contém valor real — apenas chaves vazias.
- Se um segredo vazar: rotacione `JWT_SECRET` (derruba todas as sessões),
  troque as senhas afetadas e purgue o histórico do git.

### Auditoria

`AuditLog` registra login (sucesso/falha), logout, troca/reset de senha e
operações administrativas sobre contas. Guarda ator, alvo, IP e user-agent —
nunca senha, token ou hash. Retenção de 180 dias via TTL index.

## Checklist antes de cada release

- [ ] `npm test` verde e `npm audit --audit-level=high` limpo.
- [ ] Nenhum segredo novo no código ou no `.env.example`.
- [ ] Rotas novas com `auth` + `requireRole` corretos e schema Zod.
- [ ] Saída user-facing escapada com `escapeHtml()`.
- [ ] Nada de PII, senha ou token em `console.log`.
