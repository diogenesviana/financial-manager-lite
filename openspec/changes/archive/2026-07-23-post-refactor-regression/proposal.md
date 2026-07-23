## Why

Como toda a estrutura do projeto foi refatorada para uma arquitetura hexagonal 100% isolada e desacoplada, precisamos introduzir um conjunto de testes regressivos automatizados de integração/E2E para validar se todos os fluxos de ponta a ponta e manipuladores de rotas de API continuam funcionando conforme o esperado sob a nova arquitetura, evitando regressões futuras.

## What Changes

- **Novo Suite de Teste Regressivo:** Criação de um conjunto de testes regressivos automatizados de integração para cobrir todos os endpoints principais da API.
- **Cobertura de Fluxos Principais:** Cobertura para fluxos de ponta a ponta (E2E), incluindo gerenciamento de despesas, regras de atribuição, regras de categoria, despesas compartilhadas e processamento de faturas (upload).
- **Scripts de Execução Fácil:** Adição de scripts no `package.json` para rodar os testes regressivos facilmente de forma local ou em pipelines de CI/CD.

## Capabilities

### New Capabilities
- `regression-testing`: Uma suíte de testes de integração automatizados que valida de ponta a ponta todas as rotas e fluxos críticos da aplicação.

### Modified Capabilities
<!-- Nenhuma capacidade existente teve requisitos alterados -->

## Impact

- **Testes:** Adição de arquivos sob `tests/regression/` contendo os cenários de teste automatizados de integração/E2E.
- **Scripts:** Adição do script `npm run test:regression` no `package.json`.
- **Configuração:** Ajustes de configuração do Jest ou ambiente para permitir a execução desses testes contra um banco de dados de teste isolado ou em memória.
