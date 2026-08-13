## Why

Ao realizar a sincronização de regras de categoria de gastos no painel administrativo ("Sincronizar Regras"), selecionar um usuário específico no dropdown ("Filtrar por Usuário Alvo") faz com que nenhuma despesa apareça ou seja avaliada. Isso ocorre porque o repositório de despesas aplica um filtro estrito de mês vazio (`month: ''`), que não corresponde a nenhuma despesa registrada, resultando em 0 despesas retornadas para o usuário selecionado.

## What Changes

- Corrigir a consulta de despesas por usuário no repositório (`PrismaExpenseRepository.findByUserAndMonth`) para suportar a busca de todas as despesas do usuário quando o parâmetro de mês for `'all'` ou vazio (`''`).
- Garantir que o caso de uso `SyncCategoryRules` busque e avalie corretamente todas as despesas do usuário selecionado ao aplicar o filtro de usuário no modal de simulação/confirmação.

## Capabilities

### New Capabilities

- `admin-category-sync-user-filter`: Permite filtrar e sincronizar regras de categoria para um usuário específico no painel de administração sem perder o contexto das despesas cadastradas.

### Modified Capabilities

## Impact

- `src/adapters/db/PrismaExpenseRepository.ts`: Atualização do método `findByUserAndMonth` para não aplicar o filtro rígido de mês quando `month === 'all'` ou `month === ''`.
- `src/core/use-cases/SyncCategoryRules.ts`: Ajuste para passar `'all'` ao buscar despesas do usuário alvo.
- Interface do Usuário no Painel Admin (`src/app/admin/page.tsx`): Exibição correta das despesas elegíveis para sincronização quando um usuário específico for selecionado no dropdown.
