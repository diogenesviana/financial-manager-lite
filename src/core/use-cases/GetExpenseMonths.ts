import { ExpenseRepository } from '../domain/ports/ExpenseRepository';

export class GetExpenseMonths {
  constructor(private expenseRepo: ExpenseRepository) {}

  async execute(userId: string): Promise<string[]> {
    return this.expenseRepo.findMonthsByUser(userId);
  }
}
