## ADDED Requirements

### Requirement: Filtragem e sincronização de regras de categorias por usuário alvo no admin
The system MUST allow retrieving and syncing retroactive category rules for a specific target user selected in the admin dashboard without filtering out expenses due to invalid month parameters.

#### Scenario: Visualizar despesas e simulação ao selecionar um usuário no dropdown
- **WHEN** o administrador abre o modal de sincronização de categorias no painel administrativo e seleciona um usuário específico no dropdown de filtro
- **THEN** o sistema DEVE retornar e listar todas as despesas pertencentes àquele usuário (independentemente do mês registrado) que possuam regras de categoria divergentes.

#### Scenario: Confirmar sincronização de categorias para usuário específico
- **WHEN** o administrador confirma a aplicação das regras para o usuário selecionado
- **THEN** o sistema DEVE atualizar no banco de dados apenas as despesas do usuário selecionado que tiveram regras correspondentes identificadas na simulação.
