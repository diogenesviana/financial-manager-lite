import { ExpenseRepository, SearchOptions } from '../domain/ports/ExpenseRepository'
import { Expense } from '../domain/entities/Expense'

export class SearchExpensesUseCase {
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async execute(
    userId: string,
    options: SearchOptions
  ): Promise<{ expenses: Expense[]; total: number }> {
    if (!userId) {
      throw new Error('UserId é obrigatório')
    }

    return await this.expenseRepository.search(userId, options)
  }
}
