# Deploy — Projeto Profissional (template)

Guia operacional de implantação em produção. O pacote já traz um
`docker-compose.yml` endurecido (app não-root, `read_only`, `no-new-privileges`,
healthcheck). Este documento complementa com variáveis de ambiente, proxy
reverso e backup.

## 1. Pré-requisitos

- Docker + Docker Compose v2.
- Um segredo forte para `JWT_SECRET` (nunca reuse o do `.env.example`).
- (Opcional) proxy reverso Nginx/Caddy à frente, terminando TLS.

## 2. Variáveis de ambiente (`.env`)

Copie e preencha:

```bash
cp .env.example .env
```

| Var | Obrigatória | Descrição |
|---|---|---|
| `JWT_SECRET` | **sim** | Segredo HS256 (>= 32 bytes aleatórios). Falha o boot se vazio em produção. |
| `JWT_EXPIRES_IN` | não | Expiração do token (default `2h`). |
| `MONGO_URI` | sim (compose injeta) | `mongodb://mongo:27017/app_db` (rede interna do compose). |
| `APP_BASE_URL` | não | URL pública (cookies `Secure` dependem dela). |
| `APP_NAME` | não | Nome exibido na UI. |
| `COOKIE_SECURE` | não | `true` obrigatório atrás de HTTPS. |
| `CORS_ALLOWED_ORIGINS` | não | Lista separada por vírgula (nunca `*`). |
| `ADMIN_EMAIL` / `ADMIN_NAME` | não | Dados do admin semeado. |
| `ADMIN_PASSWORD` | não | Sobrepõe o arquivo de senha compartilhado (veja abaixo). |
| `SEED_PASSWORD_FILE` | não | Arquivo local com a senha do admin (default `~/Documentos/comum/senhas-projetos.md`). **Não versionar.** |
| `BIND_ADDR` | não | Interface de bind (default `127.0.0.1`). Use o IP da VPN para acesso externo. |
| `TZ` | não | Fuso (default `America/Sao_Paulo`). |

> Em produção o seed de **demo é bloqueado** (`NODE_ENV=production`). Sobe apenas
> o admin `ADMIN_EMAIL` + usuários criados pelo próprio admin.

## 3. Subir a aplicação

```bash
JWT_SECRET=$(openssl rand -base64 48) \
ADMIN_PASSWORD=$(openssl rand -base64 18) \
docker compose up -d --build
```

A instância única escuta em `127.0.0.1:4450` e sobe **três bancos** na mesma
instância Mongo (`app_db`, `app_test_db`, `app_demo_db`). A demo é sempre
acessível pela landing (`/demo/start`), independente do modo.

Verifique a saúde:

```bash
curl -f http://localhost:4450/api/health/live
curl -f http://localhost:4450/api/health/ready
```

## 4. Proxy reverso (Nginx, exemplo)

```nginx
server {
  listen 443 ssl;
  server_name app.exemplo.com;

  ssl_certificate     /etc/letsencrypt/live/app.exemplo.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/app.exemplo.com/privkey.pem;

  # Upload máximo coerente com o limite de corpo da app (100 kB).
  client_max_body_size 128k;

  location / {
    proxy_pass http://127.0.0.1:4450;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Com Nginx na frente, defina no `.env`:

```bash
COOKIE_SECURE=true
APP_BASE_URL=https://app.exemplo.com
```

## 5. Backup

O volume `mongo_data` guarda os bancos. Faça dump regular:

```bash
docker exec projeto-professional-mongo-1 \
  mongodump --out /tmp/dump --gzip
# copie /tmp/dump para armazenamento externo
```

Para restaurar: `mongorestore --gzip --drop /tmp/dump`.

## 6. Atualização (zero-downtime por instância)

```bash
git pull
docker compose up -d --build
docker image prune -f
```

A app é *stateless* (JWT carrega o modo no payload); escala horizontalmente
atrás de um LB sem estado de sessão.

## 7. Teste de carga (opcional)

Veja `README.md` → "Teste de carga" e `docs/load-testing.md`. Use
`NODE_ENV=staging` (rate limit desligado) no ambiente de testes.

## 8. Observabilidade

- Logs: `docker compose logs -f app`.
- `GET /status` (página) e `GET /api/status/:code` (API) mapeiam todos os
  códigos HTTP devolvidos.
- `AuditLog` (retenção 180 dias) registra eventos sensíveis sem jamais armazenar
  senha, token ou hash.
