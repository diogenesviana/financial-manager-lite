## Context

No painel de administração (`/admin`), a ferramenta de "Sincronizar Regras" permite executar uma sincronização retroativa de regras de categoria. 
Atualmente, quando um `targetUserId` específico é selecionado no dropdown, a rota `/api/admin/apply-rules` executa o caso de uso `SyncCategoryRules.execute(targetUserId, dryRun)`.
Em `SyncCategoryRules`, quando `targetUserId` é fornecido, a consulta `this.expenseRepo.findByUserAndMonth(targetUserId, '')` é executada.

No repositório `PrismaExpenseRepository.ts`, `findByUserAndMonth(userId, month)` constrói a seguinte consulta no Prisma:
```ts
where: {
  userId,
  deletedAt: null,
  OR: [
    { month },
    { personId: null }
  ]
}
```
Ao passar `month: ''`, o Prisma tenta encontrar despesas que tenham `month == ''` (o que nunca ocorre, já que o formato é `YYYY-MM`) ou `personId == null` (que ignora a maioria das despesas atribuídas ao perfil do próprio usuário). Como resultado, 0 despesas são retornadas quando um usuário específico é selecionado.

## Goals / Non-Goals

**Goals:**
- Ajustar `PrismaExpenseRepository.findByUserAndMonth` para interpretar `month === 'all'` ou `month === ''` ou falsy como a ausência de filtro por mês, retornando todas as despesas do usuário.
- Ajustar `SyncCategoryRules` para passar `'all'` (ou string vazia tratada corretamente) ao buscar despesas do `targetUserId`.
- Garantir que a sincronização no admin funcione tanto para "Todos os Usuários" quanto para um "Usuário Alvo" específico.

**Non-Goals:**
- Modificar o algoritmo de match de regras de categoria (que compara `originalDescription` ou `description` com as palavras-chave da regra).
- Alterar o comportamento da rota `/api/expenses/apply-rules` de usuários comuns.

## Decisions

### Decisão 1: Tratar `month === 'all'` e `month === ''` em `PrismaExpenseRepository.findByUserAndMonth`
**Opção Escolhida**: Em `PrismaExpenseRepository.findByUserAndMonth(userId, month)`:
Se `month` for `'all'` ou `''` (ou falsy), não incluir a cláusula `OR: [{ month }, { personId: null }]` na instrução `where`. A cláusula `where` será simplesmente `{ userId, deletedAt: null }`.
**Razão**: Isso harmoniza a busca no repositório. Métodos em outros casos de uso (como em `ListPeople.ts`) já tentavam chamar `findByUserAndMonth(userId, 'all')` esperando todas as despesas do usuário. Essa alteração corrige esse padrão em toda a aplicação.

### Decisão 2: Atualizar `SyncCategoryRules.ts`
**Opção Escolhida**: Atualizar a chamada em `SyncCategoryRules.ts` de `this.expenseRepo.findByUserAndMonth(targetUserId, '')` para `this.expenseRepo.findByUserAndMonth(targetUserId, 'all')`.
**Razão**: Explicita a intenção de buscar todas as despesas do usuário para a sincronização.

## Risks / Trade-offs

- [Risco] A remoção do filtro de mês quando `month === 'all'` pode trazer mais dados do que o esperado em partes do sistema se algum chamador dependesse de `month: 'all'` buscando uma string literal `'all'`.
  → **Mitigação**: Nenhuma despesa no banco de dados possui o valor literal `'all'` no campo `month` (os meses são sempre no formato `YYYY-MM`).
