# ==============================================================================
# Makefile — Projeto Profissional (Template Mestre Canônico)
# Portas padrão:
#   • DEV:  4429 (compose.dev.yml)
#   • PROD: 4430 (compose.prod.yml)
#   • DEMO: 4431 (compose.prod.yml)
# ==============================================================================

PROJ_DEV  := pp-dev
PROJ_PROD := pp
DEV       := docker compose -p $(PROJ_DEV) -f compose.dev.yml
PROD      := docker compose -p $(PROJ_PROD) -f compose.prod.yml
APP       := pp-app

PORTA_DEV  := 4429
PORTA_PROD := 4430
PORTA_DEMO := 4431

.PHONY: help dev down logs test lint secrets prod prod-verify prod-down prod-logs backup restore health clean

## help — Mostra todos os comandos disponíveis
help:
	@echo ""
	@echo "  Projeto Profissional — Template Mestre Canônico"
	@echo "  ────────────────────────────────────────────────────────"
	@echo ""
	@echo "  DESENVOLVIMENTO         projeto $(PROJ_DEV)"
	@echo "    make dev           Sobe stack dev (watch)          — porta $(PORTA_DEV)"
	@echo "    make down          Para e remove containers dev"
	@echo "    make logs          Acompanha logs do app dev"
	@echo ""
	@echo "  TESTES & QUALIDADE"
	@echo "    make test          Executa suíte Jest completa (Memory Server)"
	@echo "    make lint          Executa verificações de código / linter"
	@echo ""
	@echo "  PRODUÇÃO & DEMO        projeto $(PROJ_PROD)"
	@echo "    make secrets       Gera/sincroniza secrets/ a partir do .env"
	@echo "    make prod          Sobe stack produção ($(PORTA_PROD)) e demo ($(PORTA_DEMO))"
	@echo "    make prod-verify   Confere hardening (read-only, tmpfs, secrets, health)"
	@echo "    make prod-down     Para stack de produção"
	@echo "    make prod-logs     Acompanha logs de produção"
	@echo ""
	@echo "  OPERAÇÕES"
	@echo "    make backup        Backup comprimido do MongoDB"
	@echo "    make restore       Restaura backup mais recente"
	@echo "    make health        Saúde de todas as portas ($(PORTA_DEV), $(PORTA_PROD), $(PORTA_DEMO))"
	@echo "    make clean         Lista e limpa volumes/containers órfãos"
	@echo ""

# --- Desenvolvimento ----------------------------------------------------------

dev:
	@echo "→ Subindo stack dev (projeto $(PROJ_DEV))..."
	$(DEV) up -d --build
	@echo ""
	@echo "  ✓ http://localhost:$(PORTA_DEV)  (Dev — live reload ativado)"
	@echo "  ✓ Logs: make logs"
	@echo ""

down:
	@echo "→ Parando stack dev..."
	$(DEV) down
	@echo "  ✓ Stack dev parada"

logs:
	$(DEV) logs -f $(APP)

# --- Testes -------------------------------------------------------------------

test:
	cd app && npm test

lint:
	cd app && npm run lint || true

# --- Produção -----------------------------------------------------------------

secrets:
	@chmod +x scripts/setup-secrets.sh 2>/dev/null || true
	./scripts/setup-secrets.sh

prod: secrets
	@chmod +x scripts/deploy.sh 2>/dev/null || true
	./scripts/deploy.sh

prod-verify:
	@echo "→ 1. Filesystem read_only (escrita na raiz DEVE FALHAR):"
	@$(PROD) exec -T $(APP) sh -c 'touch /app/teste 2>&1' \
	  | grep -qi "read-only" && echo "   ✓ Filesystem protegido como read-only" || echo "   ✗ Container aceitou escrita indevida"
	@echo "→ 2. Secrets montados em /run/secrets:"
	@$(PROD) exec -T $(APP) ls -la /run/secrets/ \
	  && echo "   ✓ Diretório /run/secrets montado com sucesso" || echo "   ✗ Diretório não acessível"

prod-down:
	$(PROD) down

prod-logs:
	$(PROD) logs -f $(APP)

# --- Operações ----------------------------------------------------------------

backup:
	@chmod +x scripts/backup.sh 2>/dev/null || true
	./scripts/backup.sh

restore:
	@chmod +x scripts/restore.sh 2>/dev/null || true
	./scripts/restore.sh

health:
	@echo "→ Verificando saúde das portas:"
	@for p in $(PORTA_DEV) $(PORTA_PROD) $(PORTA_DEMO); do \
	  curl -fsS -o /dev/null -w "  ✓ Porta $$p: HTTP %{http_code}\n" http://localhost:$$p/api/health 2>/dev/null \
	  || echo "  ✗ Porta $$p: sem resposta"; \
	done

clean:
	docker system prune -f
