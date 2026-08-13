# danger-zone-usability-redesign Specification

## Purpose
TBD - created by archiving change redesign-danger-zone-usability. Update Purpose after archive.
## Requirements
### Requirement: Modal dedicado para gerenciamento seguro da Zona de Perigo
The system MUST provide a dedicated interactive modal for managing Danger Zone destructive actions, opened via a prominent trigger card on the profile and admin pages.

#### Scenario: Abertura do modal da Zona de Perigo a partir da página de perfil
- **WHEN** o usuário clica no botão "Gerenciar Zona de Perigo" no card da página de perfil
- **THEN** o sistema MUST abrir o modal contendo todos os cartões de ação destrutiva (`DangerZoneItem`) com suas respectivas descrições e badges.

#### Scenario: Visualização dos cards de ação descritivos no modal
- **WHEN** o modal da Zona de Perigo estiver aberto
- **THEN** o sistema MUST apresentar cada opção de limpeza em um card individual contendo título explicativo, texto legível inline das consequências e badge do nível de impacto (`MODERADO`, `ALTO`, `CRÍTICO`).

#### Scenario: Confirmação de segundo nível ao executar uma ação no modal
- **WHEN** o usuário clica no botão de ação dentro do modal da Zona de Perigo
- **THEN** o sistema MUST abrir o modal de confirmação final (`ConfirmModal`) solicitando a confirmação explícita antes de chamar a API de limpeza.

