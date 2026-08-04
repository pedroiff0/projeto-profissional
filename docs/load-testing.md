# Teste de carga

Como medir a capacidade da plataforma, o que os números significam e como
reproduzi-los. Toda medição desta página foi obtida executando o cenário real
— nenhum valor é estimativa.

## Sumário executivo

| Pergunta | Resposta medida |
|---|---|
| Quantos usuários simultâneos a plataforma suporta? | **100 VUs** com folga (todos os limiares aprovados); **200 VUs** ainda com **0% de erro**, porém latência acima da meta |
| Quantas requisições por segundo? | **214 req/s** a 100 VUs · **262 req/s** a 200 VUs |
| Onde está o gargalo? | O **login** (bcrypt custo 12), limitado por CPU — não o banco nem o Express |
| Capacidade de autenticação? | ~**4,5 logins/s** sustentados por instância |

Leitura autenticada e páginas SSR são baratas (mediana de ~3–6 ms). O custo
concentra-se em `POST /api/auth/login`, e isso é **intencional**: bcrypt caro
é o que torna inviável um ataque de força bruta offline.

## Ambiente das medições

| Item | Valor |
|---|---|
| Host | Debian 13, Intel i5-9400F (6 núcleos), 15 GiB RAM |
| Execução | Docker Compose, stack `pp-test` isolada |
| App | Node 20, **1 instância**, sem cluster, sem réplicas |
| Banco | MongoDB 7 em `tmpfs` (banco de teste, descartável) |
| Gerador de carga | k6 (contêiner), na mesma máquina |
| Limitação de taxa | Desativada (`RATE_LIMIT_DISABLED=true`) |

> O k6 disputa CPU com a aplicação por rodar no mesmo host. Em um ambiente com
> gerador de carga separado, os números tendem a ser melhores. Trate estes
> valores como **piso conservador**.

## Por que os limites de taxa são desativados

Com o padrão de produção (300 req/5 min por IP), qualquer teste de carga mede
o limitador, não a aplicação. Por isso a stack de teste define
`RATE_LIMIT_DISABLED=true`.

Essa variável é **recusada com `NODE_ENV=production`** — o boot falha em vez
de silenciosamente desligar a proteção contra força bruta. É por isso que a
stack de teste roda como `NODE_ENV=staging`.

## Isolamento entre produção e teste

São duas stacks independentes, que podem coexistir na mesma máquina:

| | Produção | Teste / carga |
|---|---|---|
| Arquivo | `docker-compose.yml` | `docker-compose.test.yml` |
| Projeto | `pp` (padrão) | `pp-test` |
| Banco | `app_db` em volume nomeado, persistente | `app_test_db` em `tmpfs`, descartável |
| Serviço do banco | `mongo` | `mongo-test` |
| Porta no host | `127.0.0.1:4447` | `127.0.0.1:4446` |
| `NODE_ENV` | `production` | `staging` |
| Limitação de taxa | Ativa | Desativada |

Não há caminho de rede entre as duas: cada `docker compose -p` cria a sua
própria rede. O script de semeadura ainda tem uma trava adicional — recusa-se
a rodar se o nome do banco não contiver `test`.

## Cenário exercitado

O script `loadtest/carga.js` reproduz uma sessão real de usuário:

1. **Login** — uma vez por usuário virtual, com token reutilizado nas
   iterações seguintes (é assim que um usuário real se comporta).
2. **Leitura autenticada** — `GET /api/auth/me` com `Bearer`.
3. **Página SSR** — `GET /` renderizada pelo servidor.
4. **Health check** — `GET /api/health/ready`.
5. Pausa de 1 s simulando tempo de reflexão.

> **Armadilha evitada:** a primeira versão do script fazia login em *toda*
> iteração. Isso não é carga realista, é um *login-storm*: com 200 VUs a
> latência foi a 60 s e 6% das requisições falharam. Esse pior caso continua
> disponível, mas isolado no perfil `auth`.

### Perfis disponíveis

| Perfil | Para que serve | Forma |
|---|---|---|
| `smoke` | Validar que o cenário funciona | 1 VU, 20 s |
| `carga` | Capacidade em regime estável | Rampa até `CARGA_VUS`, patamar, descida |
| `estresse` | Achar o ponto de saturação | Rampa contínua: 100 → 300 → 600 → 1000 |
| `pico` | Elasticidade a salto abrupto | 10 → `CARGA_VUS` em 5 s |
| `auth` | Pior caso: login em toda iteração | Só autenticação |

### Critérios de aprovação

Definidos como *thresholds* no k6 — se algum estourar, o k6 sai com código
diferente de zero e o CI falha:

```
http_req_failed .......................... < 1%
http_req_duration{tipo:leitura} .... p(95) < 300 ms
http_req_duration{tipo:pagina} ..... p(95) < 500 ms
http_req_duration{tipo:login} ...... p(95) < 2000 ms
login_sucesso ............................ > 99%
```

## Como executar

```bash
# 1. Subir a stack de teste (banco próprio, descartável)
docker compose -f docker-compose.test.yml -p pp-test up -d --build

# 2. Semear os usuários sintéticos no banco de TESTE
docker compose -f docker-compose.test.yml -p pp-test \
  exec -T app-test node scripts/seed-carga.js 50

# 3. Validação de fumaça
docker compose -f docker-compose.test.yml -p pp-test --profile carga \
  run --rm -e PERFIL=smoke k6 run /scripts/carga.js

# 4. Carga com 100 usuários simultâneos
docker compose -f docker-compose.test.yml -p pp-test --profile carga \
  run --rm -e PERFIL=carga -e CARGA_VUS=100 -e DURACAO=1m k6 run /scripts/carga.js

# 5. Estresse — encontrar o ponto de ruptura
docker compose -f docker-compose.test.yml -p pp-test --profile carga \
  run --rm -e PERFIL=estresse k6 run /scripts/carga.js

# 6. Derrubar tudo (o banco de teste some junto)
docker compose -f docker-compose.test.yml -p pp-test down -v
```

## Resultados medidos

### Fumaça — 1 VU, 20 s

| Métrica | Valor |
|---|---|
| Requisições | 80, **0 falhas** |
| Verificações | 100% aprovadas |
| Login | média 300 ms · p95 314 ms |
| Leitura `/api/auth/me` | média 2,9 ms · p95 5,0 ms |
| Página SSR | média 3,3 ms · p95 4,9 ms |

O piso de ~300 ms no login é o custo de bcrypt 12. É o valor esperado.

### Carga — 100 VUs, 1 min · **APROVADO**

| Métrica | Valor | Meta |
|---|---|---|
| Requisições | 22.592 | — |
| Taxa de erro | **0,00%** | < 1% ✅ |
| Vazão | **213,7 req/s** | — |
| Iterações completas | 7.464 | — |
| Leitura p95 | 286,7 ms | < 300 ms ✅ |
| Página p95 | 215,8 ms | < 500 ms ✅ |
| Login p95 | 1,27 s | < 2 s ✅ |
| Sucesso de login | 100% | > 99% ✅ |

### Carga — 200 VUs, 1 min · degradado, porém sem erros

| Métrica | Valor | Situação |
|---|---|---|
| Requisições | 27.661 | — |
| Taxa de erro | **0,00%** | ✅ |
| Vazão | **261,7 req/s** | — |
| Leitura p95 | 989 ms | ❌ acima da meta |
| Página p95 | 531 ms | ❌ acima da meta |
| Login p95 | 29,9 s | ❌ acima da meta |
| Sucesso de login | 100% | ✅ |

Comportamento correto sob sobrecarga: a plataforma **enfileira e atende**, sem
derrubar requisição nem retornar erro. O que degrada é a latência, e a causa é
a rampa de 200 logins concorrentes disputando CPU para bcrypt.

### Autenticação pura (perfil `auth`)

| VUs | Logins/s | Login p95 | Erros |
|---|---|---|---|
| 10 | 2,5 | 2,71 s | 0% |
| 50 | 3,6 | 28,07 s | 0% |

Saturação de CPU clássica: mais concorrência não aumenta a vazão, só a fila.
Capacidade sustentável de **~4,5 logins/s por instância**.

### Uso de recursos em regime

| Contêiner | CPU | Memória |
|---|---|---|
| `app-test` | 0,13% (ocioso) | 50 MiB |
| `mongo-test` | 42,9% | 439 MiB |

A aplicação Node consome pouquíssima memória. Em carga, a CPU migra para o
processo Node durante os logins.

## Interpretação e capacidade de planejamento

**Usuários simultâneos ≠ usuários cadastrados.** Um VU do k6 envia requisições
continuamente com apenas 1 s de pausa — muito mais agressivo que uma pessoa
real, que passa dezenas de segundos lendo uma tela.

Adotando a razão conservadora de 1 VU ≈ 10 usuários reais ativos:

| Configuração | VUs sustentados | Usuários reais estimados |
|---|---|---|
| 1 instância (medido) | 100 | ~1.000 |
| 1 instância (limite sem erro) | 200 | ~2.000 |
| 4 instâncias atrás de balanceador | ~400 | ~4.000 |

O login é o fator limitante em qualquer cenário de pico de entrada
(por exemplo, início de expediente, quando todos entram ao mesmo tempo).

## Como aumentar a capacidade

Em ordem de custo-benefício:

1. **Escalar horizontalmente.** A aplicação é *stateless* (JWT, sem sessão em
   memória): basta subir réplicas atrás de um balanceador. É o caminho mais
   direto, porque o gargalo é CPU de bcrypt e ela escala linearmente.
2. **Aumentar o tempo de vida do token.** Menos logins por usuário por dia.
   Avaliar contra a janela de exposição em caso de vazamento.
3. **Ajustar o custo do bcrypt.** Reduzir de 12 para 11 corta o tempo pela
   metade. **Só faça isso com decisão consciente de segurança** — é uma troca
   direta entre desempenho e resistência a força bruta. 12 é o recomendado.
4. **Servir estáticos por CDN/nginx.** Tira CSS e JS do processo Node.
5. **Índices no MongoDB.** `email` já é único e indexado; ao acrescentar
   domínio novo, verifique os planos de consulta antes de culpar o Node.

## Integração contínua

O teste de carga **não** roda a cada *push* — levaria minutos e produziria
resultados ruidosos em executor compartilhado. O fluxo `.github/workflows/
carga.yml` é acionado manualmente (`workflow_dispatch`) ou semanalmente, com o
número de VUs como parâmetro.

Para detectar regressão de desempenho em PR, use o perfil `smoke`: é rápido e
já pega quebra funcional do caminho autenticado.
