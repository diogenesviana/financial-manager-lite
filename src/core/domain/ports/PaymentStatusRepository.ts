import { PaymentStatus } from '../entities/PaymentStatus';

export interface PaymentStatusRepository {
  findByMonthAndUser(month: string, userId: string): Promise<PaymentStatus[]>;
  upsert(personId: string, month: string, isPaid: boolean): Promise<PaymentStatus>;
  deleteByPersonAndMonth(personId: string, month: string): Promise<void>;
}
