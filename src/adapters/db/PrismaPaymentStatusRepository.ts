import { PaymentStatusRepository } from '@/core/domain/ports/PaymentStatusRepository';
import { PaymentStatus } from '@/core/domain/entities/PaymentStatus';
import prisma from '@/lib/prisma';

export class PrismaPaymentStatusRepository implements PaymentStatusRepository {
  async findByMonthAndUser(month: string, userId: string): Promise<PaymentStatus[]> {
    return prisma.paymentStatus.findMany({
      where: {
        month,
        person: {
          userId
        }
      }
    });
  }

  async upsert(personId: string, month: string, isPaid: boolean): Promise<PaymentStatus> {
    return prisma.paymentStatus.upsert({
      where: {
        personId_month: { personId, month }
      },
      update: { isPaid },
      create: { personId, month, isPaid }
    });
  }

  async deleteByPersonAndMonth(personId: string, month: string): Promise<void> {
    await prisma.paymentStatus.deleteMany({
      where: { personId, month }
    });
  }
}
