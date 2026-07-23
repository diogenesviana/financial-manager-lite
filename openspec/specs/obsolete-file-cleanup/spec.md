# obsolete-file-cleanup Specification

## Purpose
TBD - created by archiving change cleanup-obsolete-files. Update Purpose after archive.
## Requirements
### Requirement: Higiene da raiz do repositório
O projeto SHALL manter apenas arquivos essenciais e documentação de entrada na raiz. Arquivos temporários, scripts de inspeção ad-hoc com credenciais/IDs hardcoded e redirecionadores legados redundantes SHALL ser removidos.

#### Scenario: Verificação de arquivos redundantes na raiz
- **WHEN** um desenvolvedor inspeciona a raiz do projeto
- **THEN** os arquivos `ux_architecture_guidelines.md`, `inspect_expenses.js` e `CLAUDE.md` não estão presentes
- **AND** a documentação em `docs/` e `README.md` permanece intacta e funcional

