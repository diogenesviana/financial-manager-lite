import { PaymentStatusRepository } from '../domain/ports/PaymentStatusRepository';
import { PaymentStatus } from '../domain/entities/PaymentStatus';

export class GetPaymentStatuses {
  constructor(private statusRepo: PaymentStatusRepository) {}

  async execute(month: string, userId: string): Promise<PaymentStatus[]> {
    if (!month) {
      throw new Error('Mês é obrigatório');
    }
    return this.statusRepo.findByMonthAndUser(month, userId);
  }
}
