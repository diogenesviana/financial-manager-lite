## Why

O projeto atualmente possui um design arquitetural inconsistente onde algumas partes utilizam modelos de domínio, portas e adaptadores (arquitetura hexagonal), enquanto muitas rotas de API ignoram essas abstrações e executam consultas diretas ao banco de dados usando o Prisma ou chamam funções auxiliares diretamente. Atender ao requisito de 100% de Arquitetura Hexagonal irá desacoplar as regras de negócio dos detalhes de infraestrutura, unificar os padrões de desenvolvimento no código e simplificar os testes.

## What Changes

- **Padronização do Core**: Unificar todas as regras de negócio (casos de uso) sob `src/core/use-cases/` e garantir que todas as entidades de domínio e interfaces de portas sejam definidas em `src/core/domain/`.
- **Refatoração dos Manipuladores de API**: Atualizar todos os manipuladores de rotas em `src/app/api/` para funcionarem estritamente como adaptadores primários (driving adapters), analisando as requisições de entrada, invocando o caso de uso apropriado e formatando a saída, sem chamadas diretas ao banco via Prisma.
- **Adaptadores de Infraestrutura**: Expandir os repositórios e adaptadores em `src/adapters/` (ex: repositórios Prisma, autenticação, provedores de notificação e integrações de IA) para implementar todas as portas do domínio.
- **Injeção de Dependência Limpa**: Garantir que as dependências (como repositórios) sejam instanciadas e injetadas nos casos de uso, evitando dependências fixas (hardcoded) no domínio.

## Capabilities

### New Capabilities
- `hexagonal-architecture`: Separação clara de fronteiras arquiteturais.

### Modified Capabilities
<!-- Nenhuma, esta refatoração preserva toda a funcionalidade e os requisitos existentes sem alterar comportamentos de recursos voltados ao usuário. -->

## Impact

- **Manipuladores de Rotas de API (`src/app/api/**/route.ts`)**: Todos os manipuladores de rotas serão modificados para utilizar casos de uso em vez de consultas diretas ao banco de dados.
- **Cliente Prisma (`prisma/schema.prisma`)**: Nenhuma mudança no esquema, mas as operações de banco de dados ficam restritas a `src/adapters/db/`.
- **Testes Unitários e de Integração**: Os testes existentes serão atualizados/adaptados para testar os casos de uso diretamente ou mockar as novas interfaces de adaptadores.
