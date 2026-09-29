# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added
- Makefile padronizado com alvos `help`, `dev`, `test`, `lint`, `prod`, `health`, `clean`.
- Arquitetura de ouro espelhada do `research`: Docker Compose (`compose.dev.yml`), Dockerfile multi-stage e Nginx proxy reverso.
- Documentação mestre completa: `AGENTS.md` (regras canônicas), `README.md` (badges e diagramas), `HANDOFF.md` (compacto e de alta densidade).
- Suíte de habilidades de IA em `.agents/skills/` (`architecture`, `testing`, `code-review`).
- Templates estruturados de Issue e Pull Request em `.github/`.
- Workflow ultra-rápido de CI em `.github/workflows/ci.yml`.

### Fixed
- Sanitização de schemas Zod e modelo Mongoose de `Project` permitindo atribuição padrão de `responsavelId`.
- Isolamento de testes Jest em memória com 100% de sucesso (77 testes passando).

## [0.2.0] - 2026-08-08

### Added
- Vitrine de tarefas e quadro Kanban estilo Todoist/Trello.
- Suporte a múltiplos idiomas (PT/EN/ES/FR) via middleware `i18n`.
- Mapeamento completo de códigos HTTP e telas de erro em `/status`.
