## 1. Configuração do Ambiente de Teste Regressivo

- [x] 1.1 Configurar o arquivo de testes regressivos Jest e mock de infraestrutura de banco de dados / autenticação.
- [x] 1.2 Adicionar o script `test:regression` no `package.json` apontando para a suíte regressiva.

## 2. Implementação das Suítes de Teste Regressivo

- [x] 2.1 Criar testes regressivos integrados para as rotas administrativas (`admin/categories`, `admin/banks`, `admin/wipe`).
- [x] 2.2 Criar testes regressivos integrados para as rotas de despesas e regras de usuários (`expenses`, `expenses/clear`, `expenses/suggestions`, `rules`, `category-rules`).
- [x] 2.3 Criar testes regressivos integrados para rotas de autenticação, SSO do Google e perfil (`auth/me`, `auth/change-password`, `auth/google/callback`).
- [x] 2.4 Criar testes regressivos integrados para rotas de upload e leitura de notas (`upload`).

## 3. Execução e Homologação

- [x] 3.1 Executar a suíte de testes regressivos `npm run test:regression` e garantir 100% de sucesso.
