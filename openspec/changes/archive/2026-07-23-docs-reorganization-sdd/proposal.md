## Why

A documentação atual do projeto está fragmentada e desorganizada: o `README.md` mistura funcionalidades, instruções de setup e termos legais sem hierarquia clara; o `CHANGELOG.md` usa formato narrativo ao invés do padrão Keep a Changelog; o `BACKLOG.md` não segue nenhum template reconhecido; e o `ux_architecture_guidelines.md` está solto na raiz sem conexão com uma estrutura `docs/`. Além disso, não existe documentação de arquitetura (SDD — Software Design Document), diagramas de banco de dados, referência de API ou guia de contribuição. Isso dificulta onboarding de novos desenvolvedores e manutenção do projeto.

## What Changes

- **README.md**: Reescrever completamente seguindo boas práticas (badges, sumário, screenshots placeholder, seções padronizadas de instalação/uso/contribuição/licença). Atualizar a versão para `1.4.5` (atual do `package.json`).
- **CHANGELOG.md**: Reformatar seguindo o padrão [Keep a Changelog](https://keepachangelog.com/) com categorias `Added`, `Changed`, `Fixed`, `Removed`.
- **BACKLOG.md**: Reorganizar com categorias de prioridade e status padronizados, mantendo o conteúdo existente.
- **docs/ARCHITECTURE.md** (novo): Criar um Software Design Document (SDD) documentando a arquitetura Clean Architecture do projeto (entities → ports → use-cases → adapters → app), o schema Prisma, a stack tecnológica e os fluxos principais.
- **docs/API_REFERENCE.md** (novo): Criar referência dos 18 endpoints da API (`/api/*`) com métodos HTTP, parâmetros e respostas.
- **docs/DATABASE.md** (novo): Documentar o schema PostgreSQL/Prisma — 11 modelos, relacionamentos e índices — com diagrama ER em Mermaid.
- **CONTRIBUTING.md** (novo): Guia de contribuição com convenções de commit, branching, linting e testes.
- **ux_architecture_guidelines.md**: Mover para `docs/UX_GUIDELINES.md` e ajustar referências internas.

## Capabilities

### New Capabilities
- `documentation-structure`: Reorganização da estrutura de documentos do projeto com diretório `docs/` e arquivos padronizados (ARCHITECTURE, API_REFERENCE, DATABASE, CONTRIBUTING).

### Modified Capabilities
_(nenhuma capability existente com specs modificados — esta mudança é exclusivamente documental)_

## Impact

- **Arquivos modificados**: `README.md`, `CHANGELOG.md`, `BACKLOG.md`
- **Arquivos criados**: `docs/ARCHITECTURE.md`, `docs/API_REFERENCE.md`, `docs/DATABASE.md`, `CONTRIBUTING.md`
- **Arquivos movidos**: `ux_architecture_guidelines.md` → `docs/UX_GUIDELINES.md`
- **Código-fonte**: Nenhuma alteração em código-fonte, testes ou configurações
- **Dependências**: Nenhuma nova dependência
- **Risco**: Zero — mudanças exclusivamente documentais, sem impacto em runtime
