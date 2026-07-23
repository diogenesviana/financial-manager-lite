import { PaymentStatusRepository } from '../domain/ports/PaymentStatusRepository';
import { PersonRepository } from '../domain/ports/PersonRepository';
import { ExpenseRepository } from '../domain/ports/ExpenseRepository';
import { NotificationRepository } from '../domain/ports/NotificationRepository';
import { NotificationService } from '../domain/services/NotificationService';
import { PaymentStatus } from '../domain/entities/PaymentStatus';

export class UpdatePaymentStatus {
  constructor(
    private statusRepo: PaymentStatusRepository,
    private personRepo: PersonRepository,
    private expenseRepo: ExpenseRepository,
    private notificationRepo: NotificationRepository
  ) {}

  async execute(data: {
    personId: string;
    month: string;
    isPaid: boolean;
    userId: string;
    userName: string;
  }): Promise<PaymentStatus> {
    const { personId, month, isPaid, userId, userName } = data;

    if (!personId || !month) {
      throw new Error('Dados inválidos');
    }

    const person = await this.personRepo.findById(personId);
    if (!person || person.userId !== userId) {
      throw new Error('Pessoa não encontrada');
    }

    const status = await this.statusRepo.upsert(personId, month, isPaid);

    // Propagate monthly status to individual expenses
    await this.expenseRepo.updateManyPaid(userId, personId, month, isPaid);

    // Envia notificação para o devedor se houver usuário vinculado e for marcado como pago
    if (isPaid && person.linkedUserId && person.linkedUserId !== userId) {
      await NotificationService.notifyMonthPaid(
        this.notificationRepo,
        month,
        userName,
        person.linkedUserId
      );
    }

    return status;
  }
}
