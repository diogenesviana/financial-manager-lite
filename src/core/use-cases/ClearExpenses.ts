import { ExpenseRepository } from '../domain/ports/ExpenseRepository';
import { PersonRepository } from '../domain/ports/PersonRepository';

export class ClearExpenses {
  constructor(
    private expenseRepo: ExpenseRepository,
    private personRepo: PersonRepository
  ) {}

  async execute(userId: string, type: 'unassigned' | 'assigned' | 'reset_all' | 'all'): Promise<void> {
    if (type === 'reset_all') {
      await this.expenseRepo.clearExpenses(userId, 'all');
      await this.personRepo.clearAllByUser(userId);
    } else {
      await this.expenseRepo.clearExpenses(userId, type);
    }
  }
}
