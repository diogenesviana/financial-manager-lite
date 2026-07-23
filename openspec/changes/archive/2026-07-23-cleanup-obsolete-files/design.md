## Context

Após a reestruturação da documentação promovida pela alteração `docs-reorganization-sdd`, toda a documentação de arquitetura, banco de dados, API e diretrizes de UX/UI passou a residir em `docs/`. O arquivo `ux_architecture_guidelines.md` na raiz foi mantido temporariamente com redirecionamento, e o arquivo `inspect_expenses.js` residia na raiz como script ad-hoc de depuração.

## Goals / Non-Goals

**Goals:**
- Remover com segurança os arquivos redundantes na raiz (`ux_architecture_guidelines.md`, `inspect_expenses.js`, `CLAUDE.md`)
- Garantir que todos os arquivos mantidos na raiz tenham propósito claro e que a documentação referenciada em `README.md` continue completa e funcional

**Non-Goals:**
- Alterar arquivos de código-fonte em `src/`, `prisma/` ou suíte de testes em `tests/`
- Excluir scripts de depuração situados em `scratch/` que servem para testes isolados de desenvolvedor

## Decisions

### 1. Remoção de `ux_architecture_guidelines.md`
**Razão**: O guia completo foi transferido para `docs/UX_GUIDELINES.md` e devidamente referenciado em `README.md`. A permanência do arquivo na raiz cria duplicidade de ponto de entrada.

### 2. Remoção de `inspect_expenses.js`
**Razão**: Trata-se de um script de uso único com ID de usuário codificado manualmente. Scripts de rascunho de teste pertencem ao diretório `scratch/` e não à raiz do repositório.

### 3. Remoção de `CLAUDE.md`
**Razão**: Continha unicamente a diretiva `@AGENTS.md`. Como `AGENTS.md` já está presente na raiz e é lido nativamente pela agentic AI, o arquivo `CLAUDE.md` é redundante.

## Risks / Trade-offs

- **Possíveis links externos antigos direcionados a `ux_architecture_guidelines.md`**:
  - *Mitigação*: O arquivo `README.md` atualizado redireciona com clareza para `docs/UX_GUIDELINES.md`.
