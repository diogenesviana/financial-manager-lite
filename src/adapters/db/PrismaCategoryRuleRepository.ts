import { CategoryRuleRepository } from '@/core/domain/ports/CategoryRuleRepository';
import { CategoryRule } from '@/core/domain/entities/CategoryRule';
import prisma from '@/lib/prisma';

export class PrismaCategoryRuleRepository implements CategoryRuleRepository {
  async findByUserId(userId: string): Promise<CategoryRule[]> {
    return prisma.categoryRule.findMany({
      where: { userId },
      orderBy: { keyword: 'asc' }
    });
  }

  async findByKeywordAndUser(keyword: string, userId: string): Promise<CategoryRule | null> {
    return prisma.categoryRule.findFirst({
      where: {
        userId,
        keyword: keyword.toLowerCase().trim()
      }
    });
  }

  async findById(id: string): Promise<CategoryRule | null> {
    return prisma.categoryRule.findUnique({
      where: { id }
    });
  }

  async create(keyword: string, category: string, userId: string): Promise<CategoryRule> {
    return prisma.categoryRule.create({
      data: {
        keyword: keyword.toLowerCase().trim(),
        category,
        userId
      }
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.categoryRule.delete({
      where: { id }
    });
  }

  async findAll(): Promise<CategoryRule[]> {
    return prisma.categoryRule.findMany({
      orderBy: { keyword: 'asc' }
    });
  }
}
