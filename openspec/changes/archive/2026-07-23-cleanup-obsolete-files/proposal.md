## Why

Após a reorganização e padronização da documentação no formato SDD (com o diretório `docs/` e `README.md` atualizados), existem arquivos obsoletos e de depuração pontual na raiz do projeto (como `inspect_expenses.js` e a ponte legada `ux_architecture_guidelines.md`) que poluem a raiz do repositório. A limpeza desses arquivos redundantes garante a higiene e manutenibilidade do código.

## What Changes

- **Remoção de `ux_architecture_guidelines.md`**: O conteúdo deste documento foi completamente migrado e integrado em `docs/UX_GUIDELINES.md`. O arquivo na raiz é agora redundante e pode ser removido.
- **Remoção de `inspect_expenses.js`**: Script de inspeção de banco pontual mantido na raiz com credenciais/IDs hardcoded, desnecessário para produção e desenvolvimento.
- **Remoção de `CLAUDE.md`**: Arquivo redundante que continha apenas redirecionamento para `@AGENTS.md`.

## Capabilities

### New Capabilities
- `obsolete-file-cleanup`: Remoção de arquivos legados, redundantes e temporários da raiz do projeto para manter a estrutura limpa.

### Modified Capabilities
_(nenhuma capability com alteração de requisitos de negócio)_

## Impact

- **Arquivos removidos**: `ux_architecture_guidelines.md`, `inspect_expenses.js`, `CLAUDE.md`
- **Código de Produção**: Nenhum efeito colateral no código-fonte, APIs, componentes ou banco de dados
- **Riscos**: Zero — arquivos removidos são puramente redundantes ou scripts de inspeção pontual
