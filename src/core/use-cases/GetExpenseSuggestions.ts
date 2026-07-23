import { ExpenseRepository } from '../domain/ports/ExpenseRepository';

export class GetExpenseSuggestions {
  constructor(private expenseRepo: ExpenseRepository) {}

  async execute(userId: string): Promise<string[]> {
    const descriptions = await this.expenseRepo.findRecentDescriptions(userId, 200);

    const uniqueDescriptions: string[] = [];
    const seen = new Set<string>();

    for (const desc of descriptions) {
      const trimmed = desc.trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        uniqueDescriptions.push(trimmed);
      }
    }

    return uniqueDescriptions.slice(0, 50);
  }
}
