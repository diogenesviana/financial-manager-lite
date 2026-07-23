import { ExpenseRepository } from '../domain/ports/ExpenseRepository';
import { NotificationRepository } from '../domain/ports/NotificationRepository';
import { Expense } from '../domain/entities/Expense';

export class HandleSharedExpense {
  constructor(
    private expenseRepo: ExpenseRepository,
    private notificationRepo: NotificationRepository
  ) {}

  async execute(id: string, userId: string, userName: string, action: 'ACCEPT' | 'REJECT'): Promise<Expense> {
    const expense = await this.expenseRepo.findById(id);
    if (!expense) {
      throw new Error('Gasto não encontrado');
    }

    if (expense.person?.linkedUserId !== userId) {
      throw new Error('Não autorizado a alterar este gasto');
    }

    const sharedStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
    const updated = await this.expenseRepo.save({
      ...expense,
      sharedStatus
    });

    if (action === 'ACCEPT' && expense.userId) {
      await this.notificationRepo.create(
        expense.userId,
        'Gasto Compartilhado Aceito',
        `${userName} aceitou o seu gasto "${expense.description}".`
      );
    }

    return updated;
  }
}
