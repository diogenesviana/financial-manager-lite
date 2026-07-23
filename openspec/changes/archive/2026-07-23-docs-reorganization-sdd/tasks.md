## 1. Estrutura de Diretórios

- [x] 1.1 Criar o diretório `docs/` na raiz do projeto

## 2. README.md — Reescrita Completa

- [x] 2.1 Reescrever `README.md` com badges (versão, licença, Node.js, Next.js), descrição breve, sumário navegável (table of contents)
- [x] 2.2 Adicionar seção de funcionalidades principais (resumida, com emojis e links para docs)
- [x] 2.3 Adicionar seção de tech stack em formato de tabela
- [x] 2.4 Adicionar seção Quick Start com pré-requisitos e 5 passos numerados (clone → .env → migrate → dev → acesso)
- [x] 2.5 Adicionar seção de Documentação com links para todos os docs em `docs/`
- [x] 2.6 Manter seção de Licença e Autor (reformatada e condensada)

## 3. CHANGELOG.md — Reformatação Keep a Changelog

- [x] 3.1 Reformatar cabeçalho principal seguindo padrão Keep a Changelog (`# Changelog` + preâmbulo)
- [x] 3.2 Reformatar cada versão existente usando categorias `### Added`, `### Changed`, `### Fixed`
- [x] 3.3 Corrigir a ordenação das versões (mais recente primeiro) e padronizar formato de data ISO (`YYYY-MM-DD`)

## 4. BACKLOG.md — Reorganização

- [x] 4.1 Reorganizar BACKLOG.md com tabela de status e prioridade para cada item
- [x] 4.2 Padronizar as seções com template: Título, Descrição, Status, Prioridade, Próximos passos

## 5. docs/ARCHITECTURE.md — Software Design Document

- [x] 5.1 Criar `docs/ARCHITECTURE.md` com visão geral da arquitetura Clean Architecture
- [x] 5.2 Adicionar diagrama de camadas em Mermaid (flowchart: App → Use Cases → Ports ← Adapters → Entities)
- [x] 5.3 Documentar cada camada com descrição e exemplos de arquivos (`src/core/domain/entities/`, `src/core/domain/ports/`, `src/core/use-cases/`, `src/adapters/`, `src/app/`)
- [x] 5.4 Documentar o padrão de factory/injeção de dependências (`src/core/factories.ts`)
- [x] 5.5 Adicionar diagrama de fluxo Mermaid do ciclo de vida de uma request HTTP (Route Handler → Factory → Use Case → Port → Adapter → DB)

## 6. docs/API_REFERENCE.md — Referência de Endpoints

- [x] 6.1 Criar `docs/API_REFERENCE.md` com introdução (base URL, autenticação JWT via cookie)
- [x] 6.2 Documentar os endpoints de Auth: `/api/login`, `/api/logout`, `/api/auth/*`
- [x] 6.3 Documentar os endpoints de Expenses: `/api/expenses`, `/api/upload`
- [x] 6.4 Documentar os endpoints de People: `/api/people`, `/api/invites`
- [x] 6.5 Documentar os endpoints de Rules: `/api/rules`, `/api/category-rules`
- [x] 6.6 Documentar os endpoints restantes: `/api/banks`, `/api/categories`, `/api/notifications`, `/api/profile`, `/api/shared-expenses`, `/api/admin`, `/api/clear-data`, `/api/cnpj`, `/api/users`

## 7. docs/DATABASE.md — Documentação de Schema

- [x] 7.1 Criar `docs/DATABASE.md` com overview do banco (PostgreSQL, Prisma ORM)
- [x] 7.2 Adicionar diagrama ER em Mermaid com todos os 11 modelos e seus relacionamentos
- [x] 7.3 Documentar cada modelo com tabela de campos (nome, tipo, obrigatório, descrição)
- [x] 7.4 Documentar índices compostos e constraints únicos

## 8. CONTRIBUTING.md — Guia de Contribuição

- [x] 8.1 Criar `CONTRIBUTING.md` com seções: pré-requisitos, setup do ambiente de desenvolvimento, convenções de commit, estrutura de branches
- [x] 8.2 Adicionar seção de testes (`npm test`, `npm run test:regression`) e lint (`npm run lint`)
- [x] 8.3 Adicionar seção de processo de pull request e code review

## 9. UX Guidelines — Relocação

- [x] 9.1 Copiar conteúdo de `ux_architecture_guidelines.md` para `docs/UX_GUIDELINES.md` (ajustando heading)
- [x] 9.2 Substituir `ux_architecture_guidelines.md` na raiz por nota de redirecionamento para `docs/UX_GUIDELINES.md`

## 10. Verificação Final

- [x] 10.1 Verificar que todos os links internos entre documentos funcionam (README → docs/*, CONTRIBUTING → README, etc.)
- [x] 10.2 Verificar que nenhum arquivo de código-fonte foi alterado
