## Context

Com a migração de 100% da lógica de acesso a banco e inteligência de negócio dos manipuladores de rota (`src/app/api/`) para a arquitetura hexagonal (casos de uso e repositórios/adaptadores), precisamos de um mecanismo de teste regressivo robusto. Esse mecanismo deve assegurar que todas as rotas continuam respondendo corretamente, parseando parâmetros de requisição e retornando os dados estruturados corretos sem lançar exceções.

## Goals / Non-Goals

**Goals:**
- Validar a integração entre os manipuladores de rota sob `src/app/api/`, as fábricas correspondentes e os respectivos casos de uso.
- Garantir a cobertura de cenários felizes e de erro (ex: não autorizado) para todas as rotas refatoradas.
- Usar a infraestrutura de testes existente (Jest + TypeScript) para evitar adição de dependências desnecessárias.

**Non-Goals:**
- Testar a interface gráfica do usuário (UI) ou fazer testes em navegadores reais (E2E visuais).
- Levantar um banco de dados PostgreSQL físico durante a execução de testes locais (os testes usarão mocks de banco ou instâncias em memória de mocks).

## Decisions

### 1. Testes de Rota Integrados usando Jest
- **Decisão:** Importar os manipuladores de rota (ex: `GET`, `POST`, `PUT`, `DELETE`) diretamente nos testes e invocá-los usando instâncias padrões de `Request` da API nativa da Web (`NextRequest` / `Request`).
- **Alternativa Considerada:** Levantar um servidor local de teste com `supertest`.
- **Razão:** Invocação direta é extremamente rápida, não requer gerenciamento de portas de rede e é nativamente suportada pelo Next.js App Router.

### 2. Mocking Centralizado do Prisma e Sessão de Autenticação
- **Decisão:** Mockar `@/lib/auth` para retornar um usuário mockado padrão e mockar `@/lib/prisma` para simular as respostas do banco de dados na camada mais baixa.
- **Razão:** Permite exercitar todo o fluxo de controle (Route Handler -> Factory -> Use Case -> Adapter) sem exigir conectividade física com o PostgreSQL.

## Risks / Trade-offs

- **[Risco] Mocks desalinhados com a realidade do banco** → *Mitigação:* Usar TypeScript estrito e validar o retorno dos mocks com base nas interfaces geradas pelo Prisma Client.
