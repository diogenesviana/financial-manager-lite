import { BankRepository } from '@/core/domain/ports/BankRepository';
import { SystemBank } from '@/core/domain/entities/SystemBank';
import prisma, { getAuditPrisma } from '@/lib/prisma';

export class PrismaBankRepository implements BankRepository {
  async findAll(): Promise<SystemBank[]> {
    return prisma.systemBank.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async findByName(name: string): Promise<SystemBank | null> {
    return prisma.systemBank.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });
  }

  async create(name: string, userId?: string): Promise<SystemBank> {
    const client = userId ? getAuditPrisma(userId) : prisma;
    return client.systemBank.create({
      data: { name }
    });
  }

  async update(id: string, name: string, userId?: string): Promise<SystemBank> {
    const client = userId ? getAuditPrisma(userId) : prisma;
    return client.systemBank.update({
      where: { id },
      data: { name }
    });
  }

  async delete(id: string, userId?: string): Promise<void> {
    const client = userId ? getAuditPrisma(userId) : prisma;
    await client.systemBank.delete({
      where: { id }
    });
  }
}
