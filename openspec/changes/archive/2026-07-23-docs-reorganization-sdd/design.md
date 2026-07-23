## Context

O Financial Manager Lite é uma aplicação Next.js 16 + Prisma + PostgreSQL com arquitetura Clean Architecture (entities → ports → use-cases → adapters → app). Atualmente, a documentação está concentrada em poucos arquivos na raiz (`README.md`, `CHANGELOG.md`, `BACKLOG.md`, `ux_architecture_guidelines.md`) sem padronização, sem documentação técnica de arquitetura e sem guia de contribuição.

A versão atual do projeto é `1.4.5`, com 52 use cases, 15 ports, 11 entidades de domínio, 18 rotas de API, 32 componentes React e 4 camadas de testes. Essa complexidade requer documentação estruturada para facilitar manutenção e onboarding.

## Goals / Non-Goals

**Goals:**
- Reestruturar o README.md para ser conciso, atrativo e seguir boas práticas de projetos open-source (badges, sumário, seções padronizadas)
- Reformatar o CHANGELOG.md seguindo o padrão [Keep a Changelog](https://keepachangelog.com/) com versionamento semântico
- Criar documentação de arquitetura (SDD) com diagramas Mermaid descrevendo a Clean Architecture do projeto
- Criar referência de API documentando todos os 18 endpoints
- Criar documentação de banco de dados com diagrama ER (Mermaid) dos 11 modelos Prisma
- Criar guia de contribuição (CONTRIBUTING.md)
- Centralizar documentação técnica no diretório `docs/`

**Non-Goals:**
- Alterar qualquer código-fonte, testes ou configurações do projeto
- Implementar ferramentas de documentação automatizada (Swagger, TypeDoc, Storybook)
- Traduzir documentação para inglês (projeto é em português brasileiro)
- Documentar APIs externas (Google Gemini, OAuth2) — apenas referenciá-las

## Decisions

### 1. Estrutura de diretórios: `docs/` na raiz

**Decisão**: Criar um diretório `docs/` na raiz para centralizar documentação técnica.

**Alternativas consideradas**:
- Wiki do GitHub — descartada por dificultar versionamento junto ao código
- Tudo na raiz — descartada por poluir o diretório principal
- `docs/` na raiz — escolhida por ser o padrão de facto em projetos open-source e compatível com GitHub Pages

**Organização final**:
```
├── README.md                  (porta de entrada — overview + setup)
├── CHANGELOG.md               (histórico de versões — Keep a Changelog)
├── CONTRIBUTING.md            (guia de contribuição)
├── BACKLOG.md                 (melhorias futuras priorizadas)
├── docs/
│   ├── ARCHITECTURE.md        (SDD — visão geral da arquitetura)
│   ├── API_REFERENCE.md       (endpoints da API REST)
│   ├── DATABASE.md            (schema, modelos, diagrama ER)
│   └── UX_GUIDELINES.md       (movido de ux_architecture_guidelines.md)
```

### 2. Formato do CHANGELOG: Keep a Changelog

**Decisão**: Reformatar usando o padrão [Keep a Changelog](https://keepachangelog.com/) com categorias `Added`, `Changed`, `Fixed`, `Deprecated`, `Removed`.

**Alternativas consideradas**:
- Formato narrativo atual — descartado por falta de scanning rápido e padrão reconhecido
- Conventional Changelog (gerado automaticamente) — descartado por adicionar dependência de tooling
- Keep a Changelog manual — escolhido por ser amplamente reconhecido, não requer tooling e permite manter o tom editorial do autor

### 3. Diagramas: Mermaid nativo do GitHub

**Decisão**: Usar diagramas Mermaid integrados ao Markdown para arquitetura e banco de dados.

**Alternativas consideradas**:
- Imagens PNG exportadas de ferramentas externas — descartadas por dificultar manutenção
- PlantUML — descartado por exigir servidor de renderização
- Mermaid nativo — escolhido por ser renderizado nativamente pelo GitHub sem dependências

### 4. README minimalista e direcionador

**Decisão**: O README será a porta de entrada com overview, badges, quick start e links para docs detalhados. Documentação técnica profunda fica em `docs/`.

**Razão**: README muito longo afasta contribuidores. O README atual tem 95 linhas com licença e funcionalidades misturadas. A nova versão direciona para `docs/` para aprofundamento.

### 5. UX Guidelines: mover, não reescrever

**Decisão**: Mover `ux_architecture_guidelines.md` para `docs/UX_GUIDELINES.md` sem alterar o conteúdo, apenas ajustando o heading e adicionando link de volta para o README.

**Razão**: O conteúdo do guia de UX já está bem escrito e estruturado. Reescrevê-lo não agrega valor — apenas a relocação resolve a desorganização.

## Risks / Trade-offs

- **Links quebrados**: Mover `ux_architecture_guidelines.md` pode quebrar referências externas (bookmarks, links em issues) → Mitigação: manter o arquivo original com um redirecionamento (`Movido para docs/UX_GUIDELINES.md`)
- **Documentação desatualizada**: Docs técnicos estáticos desatualizam com o tempo → Mitigação: manter docs próximos ao código e incluir datas de última atualização
- **Esforço de manutenção**: Mais arquivos de documentação = mais manutenção → Mitigação: documentar apenas o que é estável (arquitetura, schema, API) e aceitar que detalhes vivem no código
