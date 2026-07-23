## 1. Núcleo Unificado e Interfaces de Portas

- [x] 1.1 Mover os casos de uso `GetAuditLogs.ts` e `GetIntegrationLogs.ts` de `src/core/domain/use-cases/` para o diretório unificado `src/core/use-cases/` e atualizar suas importações.
- [x] 1.2 Criar as interfaces `CategoryRepository` e `BankRepository` em `src/core/domain/ports/`.
- [x] 1.3 Criar as interfaces `NotificationRepository`, `PaymentStatusRepository` e `CategoryRuleRepository` em `src/core/domain/ports/`.
- [x] 1.4 Criar a interface `CnpjService` em `src/core/domain/ports/`.

## 2. Implementação dos Adaptadores de Infraestrutura

- [x] 2.1 Implementar `PrismaCategoryRepository` e `PrismaBankRepository` sob `src/adapters/db/`.
- [x] 2.2 Implementar `PrismaNotificationRepository`, `PrismaPaymentStatusRepository` e `PrismaCategoryRuleRepository` sob `src/adapters/db/`.
- [x] 2.3 Implementar `CnpjApiAdapter` sob `src/adapters/cnpj/` para buscar dados da API externa de CNPJ.

## 3. Expansão dos Casos de Uso do Core

- [x] 3.1 Criar casos de uso para operações de categoria do sistema: `ListCategories`, `CreateCategory`, `DeleteCategory`, `UpdateCategory`.
- [x] 3.2 Criar casos de uso para operações de banco do sistema: `ListBanks`, `CreateBank`, `DeleteBank`, `UpdateBank`.
- [x] 3.3 Criar casos de uso para regras de categorias, notificações e status de pagamento.
- [x] 3.4 Criar casos de uso para busca de CNPJ e operações de limpeza de dados.

## 4. Fábricas e Injeção de Dependências

- [x] 4.1 Criar `src/core/factories.ts` contendo funções de fábrica (factory functions) para instanciar adaptadores, injetá-los nos casos de uso e expor as instâncias dos casos de uso.

## 5. Refatoração dos Manipuladores de Rotas de API

- [x] 5.1 Refatorar rotas administrativas (ex: `src/app/api/admin/categories/*`, `src/app/api/admin/banks/*`) para usar as fábricas e casos de uso.
- [x] 5.2 Refatorar rotas de usuários padrão (ex: `src/app/api/categories/*`, `src/app/api/banks/*`, `src/app/api/expenses/*`, `src/app/api/rules/*`, `src/app/api/category-rules/*`) para usar as fábricas e casos de uso.
- [x] 5.3 Refatorar os demais endpoints utilitários (ex: `src/app/api/upload/*`, `src/app/api/cnpj/*`, `src/app/api/notifications/*`, `src/app/api/invites/*`, `src/app/api/clear-data/*`) para usar casos de uso.
- [x] 5.4 Remover todas as importações diretas da biblioteca Prisma dos manipuladores de rotas sob `src/app/api/`.

## 6. Verificação e Testes

- [x] 6.1 Executar `npm run lint` e checagens de compilação do TypeScript para verificar a segurança dos tipos.
- [x] 6.2 Executar os testes Jest para garantir que toda a funcionalidade original foi preservada.
