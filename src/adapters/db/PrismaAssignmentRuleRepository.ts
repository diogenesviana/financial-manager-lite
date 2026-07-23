import { AssignmentRuleRepository } from '@/core/domain/ports/AssignmentRuleRepository'
import { AssignmentRule } from '@/core/domain/entities/AssignmentRule'
import prisma from '@/lib/prisma'

export class PrismaAssignmentRuleRepository implements AssignmentRuleRepository {
  async findById(id: string): Promise<AssignmentRule | null> {
    const r = await prisma.assignmentRule.findUnique({ where: { id } })
    if (!r) return null
    return {
      id: r.id,
      keyword: r.keyword,
      personId: r.personId,
      userId: r.userId,
      createdAt: r.createdAt,
    }
  }

  async findByUser(userId: string): Promise<AssignmentRule[]> {
    const rules = await prisma.assignmentRule.findMany({
      where: { userId },
      include: { person: true },
      orderBy: { keyword: 'asc' },
    })
    return rules.map(r => ({
      id: r.id,
      keyword: r.keyword,
      personId: r.personId,
      userId: r.userId,
      createdAt: r.createdAt,
      person: r.person ? { id: r.person.id, name: r.person.name } : undefined,
    }))
  }

  async save(rule: Omit<AssignmentRule, 'id' | 'createdAt'> & { id?: string }): Promise<AssignmentRule> {
    const data = {
      keyword: rule.keyword,
      personId: rule.personId,
      userId: rule.userId,
    }

    let saved
    if (rule.id) {
      saved = await prisma.assignmentRule.update({
        where: { id: rule.id },
        data,
        include: { person: true },
      })
    } else {
      saved = await prisma.assignmentRule.create({
        data,
        include: { person: true },
      })
    }

    return {
      id: saved.id,
      keyword: saved.keyword,
      personId: saved.personId,
      userId: saved.userId,
      createdAt: saved.createdAt,
      person: saved.person ? { id: saved.person.id, name: saved.person.name } : undefined,
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.assignmentRule.delete({ where: { id } })
  }

  async clearAllByUser(userId: string): Promise<void> {
    await prisma.assignmentRule.deleteMany({ where: { userId } })
  }
}
