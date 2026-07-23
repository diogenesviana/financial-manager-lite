import { ExpenseRepository } from '../domain/ports/ExpenseRepository';

export interface GroupedSharedExpense {
  personName: string;
  ownerName: string;
  totalAmount: number;
  expenseCount: number;
  month: string;
  expenses: any[];
}

export class GetSharedExpenses {
  constructor(private expenseRepo: ExpenseRepository) {}

  async execute(userId: string): Promise<GroupedSharedExpense[]> {
    const expenses = await this.expenseRepo.findSharedExpenses(userId);

    const grouped: Record<string, GroupedSharedExpense> = {};

    for (const exp of expenses) {
      const key = `${exp.user?.email || 'unknown'}_${exp.month}`;
      if (!grouped[key]) {
        grouped[key] = {
          personName: exp.person?.name || '',
          ownerName: exp.user?.name || 'Usuário',
          totalAmount: 0,
          expenseCount: 0,
          month: exp.month,
          expenses: []
        };
      }

      if (exp.sharedStatus === 'ACCEPTED') {
        grouped[key].totalAmount += exp.amount;
      }
      grouped[key].expenseCount += 1;
      grouped[key].expenses.push({
        id: exp.id,
        date: exp.date,
        description: exp.description,
        amount: exp.amount,
        sharedStatus: exp.sharedStatus,
        isPaid: exp.isPaid,
        category: exp.category,
        card: exp.card
      });
    }

    return Object.values(grouped);
  }
}
