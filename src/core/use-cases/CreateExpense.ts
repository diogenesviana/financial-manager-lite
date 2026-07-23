import { ExpenseRepository } from '../domain/ports/ExpenseRepository';
import { PersonRepository } from '../domain/ports/PersonRepository';
import { CategoryRuleRepository } from '../domain/ports/CategoryRuleRepository';
import { Expense } from '../domain/entities/Expense';
import { resolveSharedStatusFromPerson } from '../domain/services/SharedStatusService';

export class CreateExpense {
  constructor(
    private expenseRepo: ExpenseRepository,
    private personRepo: PersonRepository,
    private categoryRuleRepo: CategoryRuleRepository
  ) {}

  async execute(data: {
    userId: string;
    description: string;
    amount: number;
    date: string;
    month?: string;
    personId?: string | null;
    card?: string | null;
    category?: string | null;
  }): Promise<Expense> {
    const { userId, description, amount, date, month, personId, card, category } = data;

    let parsedDate = new Date().toISOString();
    const monthRef = month || new Date().toISOString().substring(0, 7);
    const year = parseInt(monthRef.split('-')[0]) || new Date().getFullYear();

    if (date && date.includes('/')) {
      const parts = date.split('/');
      const day = parseInt(parts[0]);
      const monthNum = parseInt(parts[1]);
      parsedDate = new Date(year, monthNum - 1, day, 12, 0, 0, 0).toISOString();
    } else if (date) {
      parsedDate = new Date(date).toISOString();
    }

    const resolvedMonth = month || new Date(parsedDate).toISOString().substring(0, 7);

    // Verify duplicate
    const duplicate = await this.expenseRepo.findDuplicate(userId, {
      date: new Date(parsedDate),
      description: description.trim(),
      amount: amount,
      month: resolvedMonth,
      card: card || null,
      isManual: true,
    });

    if (duplicate) {
      throw new Error('Esta despesa já está cadastrada com os mesmos detalhes.');
    }

    let sharedStatus = 'ACCEPTED';
    if (personId) {
      const p = await this.personRepo.findById(personId);
      sharedStatus = resolveSharedStatusFromPerson(p);
    }

    // Auto-categorize
    let matchedCategory = category || null;
    if (!matchedCategory) {
      const categoryRules = await this.categoryRuleRepo.findByUserId(userId);
      const descLower = description.trim().toLowerCase();
      const matchedCategoryRule = categoryRules.find(r =>
        descLower.includes(r.keyword.toLowerCase())
      );
      matchedCategory = matchedCategoryRule ? matchedCategoryRule.category : 'Outros';
    }

    return this.expenseRepo.save({
      date: new Date(parsedDate),
      description: description.trim(),
      amount: amount,
      personId: personId || null,
      card: card || null,
      month: resolvedMonth,
      isManual: true,
      userId,
      sharedStatus,
      category: matchedCategory,
    });
  }
}
