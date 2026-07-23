# Guia de Contribuição (Contributing Guide)

Obrigado pelo interesse em contribuir com o **Financial Manager Lite**! Este documento estabelece as diretrizes e boas práticas para submissão de código, relatórios de bugs e melhorias.

---

## 📑 Sumário

- [📋 Pré-requisitos](#-pr%C3%A9-requisitos)
- [💻 Configuração do Ambiente](#-configura%C3%A7%C3%A3o-do-ambiente)
- [🌿 Git e Estrutura de Branches](#-git-e-estrutura-de-branches)
- [📝 Convenção de Commits](#-conven%C3%A7%C3%A3o-de-commits)
- [🧪 Execução de Testes e Linter](#-execu%C3%A7%C3%A3o-de-testes-e-linter)
- [📬 Processo de Pull Request](#-processo-de-pull-request)

---

## 📋 Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas:

- **Node.js**: `= 20.x`
- **npm**: `= 10.x`
- **Git**: `>= 2.40`
- **Editor recomendado**: VS Code (com extensões *Prisma*, *ESLint* e *Prettier*)

---

## 💻 Configuração do Ambiente

1. **Faça um Fork e Clone o Repositório**:
   ```bash
   git clone https://github.com/seu-usuario/financial-manager-lite.git
   cd financial-manager-lite
   ```

2. **Instale as Dependências**:
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente**:
   ```bash
   cp .env.example .env
   ```

4. **Prepare o Banco de Dados Local**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. **Inicie o Ambiente de Desenvolvimento**:
   ```bash
   npm run dev
   ```

---

## 🌿 Git e Estrutura de Branches

Adotamos uma variação simplificada do Git Flow:

- `main`: Branch de produção. Deve conter sempre código estável e testado.
- `feat/nome-da-feature`: Para desenvolvimento de novas funcionalidades.
- `fix/nome-do-bug`: Para correção de bugs.
- `docs/nome-da-alteracao`: Para atualizações exclusivas de documentação.

---

## 📝 Convenção de Commits

Utilizamos o padrão **Conventional Commits**:

```bash
<tipo>(<escopo>): <descrição em português no imperativo>
```

### Tipos Permitidos:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Alterações exclusivamente na documentação
- `style`: Formatação, ponto e vírgula, sem alteração de código
- `refactor`: Refatoração sem alterar comportamento externo
- `test`: Inclusão ou correção de testes automatizados
- `chore`: Atualização de tarefas de build ou dependências

### Exemplos:
- `feat(expenses): adiciona campo de observacao no gasto manual`
- `fix(pdf-parser): corrige fallback do gemini para faturas itau`
- `docs(readme): atualiza instrucoes de instalacao`

---

## 🧪 Execução de Testes e Linter

Antes de enviar qualquer alteração, certifique-se de que a suíte de testes e o linter passam sem avisos ou erros.

### Executar Testes Unitários e de Integração:
```bash
npm test
```

### Executar Testes de Regressão:
```bash
npm run test:regression
```

### Executar Verificação do Linter (ESLint):
```bash
npm run lint
```

---

## 📬 Processo de Pull Request

1. Garanta que a sua branch está atualizada com a `main` mais recente.
2. Certifique-se de que a aplicação compila sem erros (`npm run build`).
3. Abra o **Pull Request** no GitHub detalhando:
   - Qual problema o PR resolve.
   - Resumo das alterações feitas.
   - Como testar visualmente / manualmente as alterações.
4. Aguarde a revisão do código e aprovação de um mantenedor.
