# Deploy

## Pré-requisitos

Docker + Docker Compose, ou Node 20 e MongoDB 7 instalados.

## Variáveis obrigatórias em produção

| Variável        | Observação                                        |
|-----------------|---------------------------------------------------|
| `JWT_SECRET`    | Mínimo 32 caracteres. O boot falha sem ele.       |
| `MONGO_URI`     | String de conexão do Mongo.                       |
| `APP_BASE_URL`  | URL pública; define `COOKIE_SECURE` automático.   |
| `COOKIE_SECURE` | `true` só com HTTPS de ponta a ponta.             |

```bash
openssl rand -base64 48   # gerar JWT_SECRET
```

## Docker Compose

```bash
cp .env.example .env      # preencha JWT_SECRET
docker compose up -d --build
docker compose logs -f app          # a senha do admin aparece no 1º boot
```

O serviço `mongo` não publica portas: só é acessível pela rede interna do
compose. O `app` publica em `127.0.0.1:4450` por padrão — coloque um nginx ou
Caddy na frente para expor com TLS.

## Atrás de proxy reverso

`app.set('trust proxy', 1)` está configurado para **um** hop. Com mais
camadas, ajuste o valor, senão o rate limit por IP enxerga sempre o IP do
proxy. Encaminhe `X-Forwarded-For` e `X-Forwarded-Proto`.

Exemplo nginx:

```nginx
location / {
  proxy_pass http://127.0.0.1:4450;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

Com TLS terminando no nginx, defina `COOKIE_SECURE=true` e
`APP_BASE_URL=https://seu.dominio`.

## systemd (sem Docker)

```ini
[Unit]
Description=Projeto Profissional
After=network.target mongod.service

[Service]
Type=simple
User=app
WorkingDirectory=/opt/projeto/app
EnvironmentFile=/opt/projeto/.env
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

## Health checks

- `GET /api/health/live` — o processo respondeu (liveness).
- `GET /api/health/ready` — banco conectado; 503 se não (readiness).

## Backup

```bash
docker compose exec -T mongo mongodump --archive --gzip --db app_db > backup.gz
docker compose exec -T mongo mongorestore --archive --gzip < backup.gz
```

## Rotação de segredo

Trocar `JWT_SECRET` invalida **todas** as sessões imediatamente. É a resposta
correta a suspeita de vazamento; avise os usuários que precisarão entrar de novo.

## Primeiro boot

Sem nenhum admin no banco, o servidor cria um e imprime a senha uma única vez
no log. Se você perder essa linha, apague o usuário admin no banco e reinicie
para gerar outro, ou defina `ADMIN_PASSWORD` no `.env`.
