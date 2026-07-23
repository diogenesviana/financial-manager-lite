# hexagonal-architecture Specification

## Purpose
TBD - created by archiving change hexagonal-architecture. Update Purpose after archive.
## Requirements
### Requirement: Isolamento das Fronteiras Arquiteturais
O sistema SHALL isolar estritamente a lógica de negócios principal (casos de uso e modelos de domínio) dos detalhes de infraestrutura (mecanismo de consulta de banco de dados, tokens de autenticação, cliente de busca de API externa).

#### Scenario: Delegação de Manipulador de Rota
- **WHEN** uma requisição HTTP é feita para qualquer manipulador de rota em `src/app/api`
- **THEN** o manipulador SHALL obter a lógica de negócios exclusivamente através de uma instância de caso de uso e retornar a resposta sem consultar diretamente o banco de dados ou interagir com bibliotecas de terceiros

#### Scenario: Implementação de Porta por Adaptador
- **WHEN** o caso de uso principal interage com recursos externos (como Banco de Dados, serviço de Notificação, Parser de IA, busca de CNPJ)
- **THEN** ele SHALL fazer isso exclusivamente por meio de uma interface de porta definida em `src/core/domain/ports/` e implementada por adaptadores em `src/adapters/`

