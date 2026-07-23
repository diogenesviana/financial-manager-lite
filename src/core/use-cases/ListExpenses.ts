import { ExpenseRepository } from '../domain/ports/ExpenseRepository';
import { Expense } from '../domain/entities/Expense';

export class ListExpenses {
  constructor(private expenseRepo: ExpenseRepository) {}

  async execute(userId: string, month: string, personId: string | null): Promise<Expense[]> {
    if (personId) {
      return this.expenseRepo.findByPersonAndMonth(userId, personId === 'null' ? null : personId, month);
    }
    return this.expenseRepo.findByUserAndMonth(userId, month);
  }
}
