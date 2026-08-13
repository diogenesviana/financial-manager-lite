## 1. Ajuste do Repositório de Despesas

- [x] 1.1 Modificar `PrismaExpenseRepository.findByUserAndMonth` para ignorar a restrição de mês quando `month === 'all'` ou `month === ''` (ou falsy), buscando todas as despesas ativas do usuário.

## 2. Ajuste do Caso de Uso de Sincronização

- [x] 2.1 Atualizar `SyncCategoryRules.ts` para passar `'all'` ao chamar `findByUserAndMonth` quando um `targetUserId` estiver definido.

## 3. Validação e Testes

- [x] 3.1 Executar os testes automatizados ou compilação do TypeScript para garantir a integridade do código.
- [x] 3.2 Verificar o comportamento do filtro no modal de sincronização da página de administração.
