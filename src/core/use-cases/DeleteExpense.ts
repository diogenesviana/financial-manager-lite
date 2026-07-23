import { ExpenseRepository } from '../domain/ports/ExpenseRepository';

export class DeleteExpense {
  constructor(private expenseRepo: ExpenseRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const expense = await this.expenseRepo.findById(id);
    if (!expense || expense.userId !== userId) {
      throw new Error('Despesa não encontrada');
    }
    await this.expenseRepo.delete(id);
  }
}
