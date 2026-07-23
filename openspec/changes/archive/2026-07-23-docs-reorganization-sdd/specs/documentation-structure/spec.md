## ADDED Requirements

### Requirement: Estrutura de documentação centralizada
O projeto SHALL possuir um diretório `docs/` na raiz contendo toda a documentação técnica detalhada. Documentos de nível raiz (README, CHANGELOG, CONTRIBUTING, BACKLOG) SHALL permanecer na raiz por convenção.

#### Scenario: Desenvolvedor novo procura documentação técnica
- **WHEN** um desenvolvedor navega até o diretório `docs/`
- **THEN** encontra arquivos ARCHITECTURE.md, API_REFERENCE.md, DATABASE.md e UX_GUIDELINES.md

#### Scenario: README aponta para documentação detalhada
- **WHEN** um desenvolvedor lê o README.md
- **THEN** encontra links para cada documento dentro de `docs/` na seção de documentação

### Requirement: README padronizado com boas práticas
O README.md SHALL conter seções padronizadas: badges de status, descrição breve, sumário, funcionalidades principais, tech stack, quick start, links para documentação e informações de licença/autor. O README SHALL exibir a versão correta do projeto (`1.4.5`).

#### Scenario: README exibe informações essenciais
- **WHEN** um visitante abre o repositório no GitHub
- **THEN** vê badges, descrição breve, sumário navegável e seções organizadas hierarquicamente

#### Scenario: Setup rápido
- **WHEN** um desenvolvedor segue o Quick Start do README
- **THEN** consegue clonar, configurar `.env`, rodar migrações e iniciar o projeto em no máximo 5 comandos

### Requirement: CHANGELOG segue Keep a Changelog
O CHANGELOG.md SHALL ser formatado de acordo com o padrão [Keep a Changelog](https://keepachangelog.com/), usando categorias `Added`, `Changed`, `Fixed`, `Deprecated`, `Removed` sob cada versão. Versões SHALL ser listadas em ordem cronológica reversa.

#### Scenario: Usuário verifica mudanças de uma versão
- **WHEN** um usuário abre o CHANGELOG.md e busca a versão `1.4.5`
- **THEN** encontra uma entrada com data e categorias claras das mudanças

### Requirement: Documento de Arquitetura (SDD)
O arquivo `docs/ARCHITECTURE.md` SHALL documentar a arquitetura Clean Architecture do projeto incluindo: visão geral das camadas (domain/entities, domain/ports, use-cases, adapters, app), diagrama de camadas em Mermaid, lista de componentes por camada e fluxos de dados principais.

#### Scenario: Desenvolvedor entende a arquitetura
- **WHEN** um desenvolvedor abre `docs/ARCHITECTURE.md`
- **THEN** encontra um diagrama de camadas Mermaid e descrição textual de cada camada com exemplos de arquivos

#### Scenario: Desenvolvedor identifica onde criar novo use case
- **WHEN** um desenvolvedor precisa adicionar uma funcionalidade
- **THEN** o ARCHITECTURE.md indica que use cases ficam em `src/core/use-cases/` e recebem ports via injeção na factory (`src/core/factories.ts`)

### Requirement: Referência de API documentada
O arquivo `docs/API_REFERENCE.md` SHALL listar todos os endpoints HTTP da aplicação (`/api/*`) com método HTTP, path, parâmetros esperados, formato de resposta e autenticação necessária.

#### Scenario: Desenvolvedor consulta endpoint de despesas
- **WHEN** um desenvolvedor busca no API_REFERENCE.md por "expenses"
- **THEN** encontra os endpoints GET/POST/PUT/DELETE de `/api/expenses` com parâmetros e exemplos

### Requirement: Documentação de banco de dados
O arquivo `docs/DATABASE.md` SHALL documentar o schema PostgreSQL/Prisma incluindo: lista de modelos com campos e tipos, diagrama ER em Mermaid mostrando relacionamentos, e índices existentes.

#### Scenario: Desenvolvedor consulta modelo de Expense
- **WHEN** um desenvolvedor abre `docs/DATABASE.md`
- **THEN** encontra o modelo `Expense` com todos os campos, tipos, relacionamentos (User, Person) e índices compostos

### Requirement: Guia de contribuição
O arquivo `CONTRIBUTING.md` SHALL conter instruções para contribuidores incluindo: pré-requisitos, setup do ambiente, convenções de commit, estrutura de branches, como rodar testes e lint, e processo de pull request.

#### Scenario: Contribuidor externo prepara PR
- **WHEN** um contribuidor lê CONTRIBUTING.md
- **THEN** sabe como criar uma branch, rodar testes (`npm test`) e lint (`npm run lint`) antes de submeter

### Requirement: UX Guidelines acessível no diretório docs
O arquivo `ux_architecture_guidelines.md` da raiz SHALL ser movido para `docs/UX_GUIDELINES.md`, mantendo todo o conteúdo original intacto. O arquivo original na raiz SHALL conter uma nota de redirecionamento para a nova localização.

#### Scenario: Desenvolvedor acessa guia de UX pela nova localização
- **WHEN** um desenvolvedor abre `docs/UX_GUIDELINES.md`
- **THEN** encontra todo o conteúdo de diretrizes de UX/UI previamente em `ux_architecture_guidelines.md`

#### Scenario: Link antigo é redirecionado
- **WHEN** um desenvolvedor abre `ux_architecture_guidelines.md` na raiz
- **THEN** encontra uma nota indicando que o conteúdo foi movido para `docs/UX_GUIDELINES.md`
