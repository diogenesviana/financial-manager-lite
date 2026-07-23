import { CategoryRepository } from '@/core/domain/ports/CategoryRepository';
import { SystemCategory } from '@/core/domain/entities/SystemCategory';
import prisma, { getAuditPrisma } from '@/lib/prisma';

export class PrismaCategoryRepository implements CategoryRepository {
  async findAll(): Promise<SystemCategory[]> {
    return prisma.systemCategory.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async findByName(name: string): Promise<SystemCategory | null> {
    return prisma.systemCategory.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });
  }

  async create(name: string, userId?: string): Promise<SystemCategory> {
    const client = userId ? getAuditPrisma(userId) : prisma;
    return client.systemCategory.create({
      data: { name }
    });
  }

  async update(id: string, name: string, userId?: string): Promise<SystemCategory> {
    const client = userId ? getAuditPrisma(userId) : prisma;
    return client.systemCategory.update({
      where: { id },
      data: { name }
    });
  }

  async delete(id: string, userId?: string): Promise<void> {
    const client = userId ? getAuditPrisma(userId) : prisma;
    await client.systemCategory.delete({
      where: { id }
    });
  }
}
