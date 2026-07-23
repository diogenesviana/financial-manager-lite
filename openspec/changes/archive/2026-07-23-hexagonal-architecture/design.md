## Context

O repositório contém uma aplicação Next.js full-stack de gerenciamento financeiro. Embora um esqueleto de Arquitetura Hexagonal exista sob `src/core` (com `domain/entities`, `domain/ports`) e `src/adapters`, ele não é usado de forma consistente. A maioria dos endpoints sob `src/app/api/` consulta o banco de dados diretamente usando o `prisma` importado de `@/lib/prisma` ou ignora completamente a lógica dos casos de uso.

Para tornar o projeto 100% Hexagonal, precisamos:
1. Garantir que toda a lógica de negócios resida dentro dos serviços de domínio ou casos de uso em `src/core/`.
2. Garantir que todas as entradas externas (manipuladores de requisições HTTP/Next.js) se comuniquem exclusivamente com portas ou casos de uso.
3. Garantir que todas as saídas externas (bancos de dados, mecanismos de autenticação, notificações, APIs externas como busca de CNPJ ou análise com IA) estejam encapsuladas por trás de portas e implementadas via adaptadores.

## Goals / Non-Goals

**Objetivos:**
- **Zero importações diretas do Prisma nos manipuladores de rotas de API**: As rotas de API DEVEM apenas importar e chamar casos de uso ou serviços principais.
- **Interações externas orientadas a portas**: Qualquer interação com banco de dados, IA, APIs HTTP externas (como busca de CNPJ), notificações, tokens, hashing de senhas e perfis deve acontecer por meio de interfaces (portas) em `src/core/domain/ports/`.
- **Diretórios padronizados**: Organizar a lógica principal de negócios sob `src/core/` e todas as implementações de infraestrutura sob `src/adapters/`.
- **Manter a funcionalidade**: Preservar todas as funcionalidades existentes, regras de autorização (restrições de administrador/usuário) e efeitos colaterais (geração de logs de auditoria e notificações).

**Não-Objetivos:**
- **Alteração de Componentes Frontend**: Os componentes de UI do frontend (`src/components/`, `src/app/page.tsx`, etc.) estão fora do escopo da refatoração do backend, exceto onde houver alterações no contrato das rotas de API.
- **Modificação do Esquema de Banco de Dados**: A estrutura do banco de dados em `prisma/schema.prisma` está fora de escopo e permanece inalterada.
- **Reescrita de regras de negócio**: Refatorar apenas a estrutura da lógica, sem alterar o comportamento dos cálculos ou transições de status.

## Decisions

### 1. Estrutura Unificada de Diretórios e Registro de Portas
Unificar todos os elementos principais dentro do diretório `src/core/`:
- Mover os casos de uso existentes em `src/core/domain/use-cases/` (ex: `GetAuditLogs.ts`, `GetIntegrationLogs.ts`) para `src/core/use-cases/` para manter uma separação limpa.
- Definir novas portas em `src/core/domain/ports/` para os recursos atualmente acessados diretamente:
  - `CategoryRepository.ts` (para SystemCategory)
  - `BankRepository.ts` (para SystemBank)
  - `NotificationRepository.ts` (para Notification)
  - `PaymentStatusRepository.ts` (para PaymentStatus)
  - `CategoryRuleRepository.ts` (para CategoryRule)
  - `CnpjService.ts` (para busca externa na API de CNPJ)

### 2. Implementação dos Adaptadores de Banco de Dados
Criar repositórios baseados no Prisma implementando as novas portas:
- `src/adapters/db/PrismaCategoryRepository.ts`
- `src/adapters/db/PrismaBankRepository.ts`
- `src/adapters/db/PrismaNotificationRepository.ts`
- `src/adapters/db/PrismaPaymentStatusRepository.ts`
- `src/adapters/db/PrismaCategoryRuleRepository.ts`
- `src/adapters/cnpj/CnpjApiAdapter.ts` (usando Fetch API para buscar detalhes do CNPJ)

### 3. Injeção de Dependência Baseada em Fábricas (DI)
Como os manipuladores de rotas do Next.js são funções sem estado, criaremos um contêiner DI central / padrão Factory em `src/core/factories.ts` ou instanciaremos as dependências de forma inline.
A criação de um arquivo `src/core/factories.ts` garante um local único para instanciar adaptadores e injetá-los nos casos de uso. Isso evita código de instanciação duplicado em cada rota de API.

Exemplo:
```typescript
import { PrismaExpenseRepository } from '@/adapters/db/PrismaExpenseRepository';
import { SearchExpenses } from '@/core/use-cases/SearchExpenses';

export function makeSearchExpensesUseCase() {
  const expenseRepository = new PrismaExpenseRepository();
  return new SearchExpenses(expenseRepository);
}
```

### 4. Refatoração de Manipuladores de Rotas para Adaptadores Primários
Cada rota sob `src/app/api/**/*.ts` será atualizada para:
- Obter o usuário atual usando um adaptador (ex: uma abstração em torno de `getCurrentUser` ou porta de autenticação padrão).
- Instanciar o caso de uso necessário por meio das nossas fábricas DI.
- Chamar o método do caso de uso, passando objetos de transferência de dados (DTOs) limpos.
- Retornar respostas usando `NextResponse.json` estritamente mapeadas a partir de modelos de domínio ou estruturas de retorno.

## Risks / Trade-offs

- **[Risco] Alto Volume de Alterações de Código** → Mitigar migrando componente por componente (ex: Categorias e Bancos primeiro, depois Regras, depois Pessoas e Despesas). Executar os testes entre as migrações para verificar se nada foi quebrado.
- **[Risco] Contexto de Auditoria (AuditPrisma)** → Algumas consultas prisma utilizam `getAuditPrisma(userId)` para definir o contexto da sessão para o log de auditoria ao nível de linha.
  → Mitigação: Os adaptadores de banco de dados (ex: `PrismaCategoryRepository`) receberão um contexto opcional `userId` durante a instanciação ou como parâmetro para garantir que `getAuditPrisma(userId)` seja utilizado para operações de mutação.
