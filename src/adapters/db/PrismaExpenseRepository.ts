import { ExpenseRepository, SearchOptions } from '@/core/domain/ports/ExpenseRepository'
import { Expense } from '@/core/domain/entities/Expense'
import prisma, { getAuditPrisma } from '@/lib/prisma'

export class PrismaExpenseRepository implements ExpenseRepository {
  async findById(id: string): Promise<Expense | null> {
    const e = await prisma.expense.findFirst({ where: { id, deletedAt: null } })
    if (!e) return null
    return {
      id: e.id,
      date: e.date,
      description: e.description,
      amount: e.amount,
      personId: e.personId,
      card: e.card,
      isManual: e.isManual,
      month: e.month,
      userId: e.userId,
      sharedStatus: e.sharedStatus,
      category: e.category,
      createdAt: e.createdAt,
      originalDescription: e.originalDescription,
      originalAmount: e.originalAmount,
      isPaid: e.isPaid,
    }
  }

  async findByUserAndMonth(userId: string, month: string): Promise<Expense[]> {
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { month },
          { personId: null }
        ]
      },
      include: { person: true },
      orderBy: { date: 'desc' },
    })
    return expenses.map(e => ({
      id: e.id,
      date: e.date,
      description: e.description,
      amount: e.amount,
      personId: e.personId,
      person: e.person ? { id: e.person.id, name: e.person.name, avatar: e.person.avatar } : undefined,
      card: e.card,
      isManual: e.isManual,
      month: e.month,
      userId: e.userId,
      sharedStatus: e.sharedStatus,
      category: e.category,
      createdAt: e.createdAt,
      originalDescription: e.originalDescription,
      originalAmount: e.originalAmount,
      isPaid: e.isPaid,
    })) as any
  }

  async findDuplicate(
    userId: string,
    expense: Omit<Expense, 'id' | 'createdAt' | 'userId' | 'personId'>
  ): Promise<Expense | null> {
    const e = await prisma.expense.findFirst({
      where: {
        userId,
        date: expense.date,
        description: expense.description.trim(),
        amount: expense.amount,
        month: expense.month,
        card: expense.card,
        deletedAt: null,
      },
    })
    if (!e) return null
    return {
      id: e.id,
      date: e.date,
      description: e.description,
      amount: e.amount,
      personId: e.personId,
      card: e.card,
      isManual: e.isManual,
      month: e.month,
      userId: e.userId,
      sharedStatus: e.sharedStatus,
      category: e.category,
      createdAt: e.createdAt,
      originalDescription: e.originalDescription,
      originalAmount: e.originalAmount,
      isPaid: e.isPaid,
    }
  }

  async save(expense: Omit<Expense, 'id' | 'createdAt'> & { id?: string }): Promise<Expense> {
    const data = {
      date: expense.date,
      description: expense.description,
      amount: expense.amount,
      personId: expense.personId,
      card: expense.card,
      isManual: expense.isManual,
      month: expense.month,
      userId: expense.userId,
      sharedStatus: expense.sharedStatus ?? 'ACCEPTED',
      isPaid: expense.isPaid ?? false,
      category: expense.category || null,
    }

    const auditPrisma = getAuditPrisma(expense.userId)
    let saved
    if (expense.id) {
      saved = await auditPrisma.expense.update({
        where: { id: expense.id },
        data,
      })
    } else {
      saved = await auditPrisma.expense.create({
        data,
      })
    }

    return {
      id: saved.id,
      date: saved.date,
      description: saved.description,
      amount: saved.amount,
      personId: saved.personId,
      card: saved.card,
      isManual: saved.isManual,
      month: saved.month,
      userId: saved.userId,
      sharedStatus: saved.sharedStatus,
      category: saved.category,
      createdAt: saved.createdAt,
      originalDescription: saved.originalDescription,
      originalAmount: saved.originalAmount,
      isPaid: saved.isPaid,
    }
  }

  async saveMany(expenses: Omit<Expense, 'id' | 'createdAt'>[]): Promise<void> {
    if (expenses.length === 0) return
    const auditPrisma = getAuditPrisma(expenses[0].userId)
    await auditPrisma.expense.createMany({
      data: expenses.map(e => ({
        date: e.date,
        description: e.description,
        amount: e.amount,
        personId: e.personId,
        card: e.card,
        isManual: e.isManual,
        month: e.month,
        userId: e.userId,
        sharedStatus: e.sharedStatus ?? 'ACCEPTED',
        isPaid: e.isPaid ?? false,
        category: e.category || null,
      })),
    })
  }

  async delete(id: string): Promise<void> {
    const exp = await prisma.expense.findUnique({ where: { id } })
    const auditPrisma = getAuditPrisma(exp?.userId || 'SYSTEM')
    await auditPrisma.expense.delete({
      where: { id },
    })
  }

  async clearAllByUser(userId: string): Promise<void> {
    const auditPrisma = getAuditPrisma(userId)
    await auditPrisma.expense.deleteMany({
      where: { userId },
    })
  }

  async updatePerson(id: string, personId: string | null, sharedStatus?: string): Promise<void> {
    const exp = await prisma.expense.findUnique({ where: { id } })
    const auditPrisma = getAuditPrisma(exp?.userId || 'SYSTEM')
    await auditPrisma.expense.update({
      where: { id },
      data: { personId, ...(sharedStatus && { sharedStatus }) },
    })
  }

  async updateManyPerson(userId: string, fromPersonId: string, toPersonId: string | null): Promise<void> {
    const auditPrisma = getAuditPrisma(userId)
    await auditPrisma.expense.updateMany({
      where: { userId, personId: fromPersonId },
      data: { personId: toPersonId },
    })
  }

  async updateMonth(id: string, month: string): Promise<void> {
    const exp = await prisma.expense.findUnique({ where: { id } })
    const auditPrisma = getAuditPrisma(exp?.userId || 'SYSTEM')
    await auditPrisma.expense.update({
      where: { id },
      data: { month },
    })
  }

  async updatePaid(id: string, isPaid: boolean): Promise<void> {
    const exp = await prisma.expense.findUnique({ where: { id } })
    const auditPrisma = getAuditPrisma(exp?.userId || 'SYSTEM')
    await auditPrisma.expense.update({
      where: { id },
      data: { isPaid },
    })
  }

  async updateManyPaid(userId: string, personId: string, month: string, isPaid: boolean): Promise<void> {
    const auditPrisma = getAuditPrisma(userId)
    await auditPrisma.expense.updateMany({
      where: { userId, personId, month },
      data: { isPaid },
    })
  }

  async search(userId: string, options: SearchOptions): Promise<{ expenses: Expense[]; total: number; totalAmount: number }> {
    const {
      page,
      limit,
      search,
      month,
      personId,
      category,
      isPaid,
      source,
      sortBy = 'date',
      sortDir = 'desc'
    } = options

    const where: any = {
      userId,
      deletedAt: null
    }

    if (search && search.trim()) {
      const parsedAmount = parseFloat(search.replace(',', '.').trim())
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { card: { contains: search, mode: 'insensitive' } }
      ]
      
      if (!isNaN(parsedAmount)) {
        where.OR.push({ amount: { equals: parsedAmount } })
      }
    }

    if (month === 'last30') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      where.date = { gte: thirtyDaysAgo }
    } else if (month && month !== 'all') {
      where.month = month
    }

    if (personId && personId !== 'all') {
      if (personId === 'none') {
        where.personId = null
      } else {
        where.personId = personId
      }
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (isPaid && isPaid !== 'all') {
      where.isPaid = isPaid === 'true'
    }

    if (source && source !== 'all') {
      where.isManual = source === 'manual'
    }

    const validSortFields = ['date', 'createdAt', 'amount', 'description']
    const validSortDirs = ['asc', 'desc']
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'date'
    const finalSortDir = validSortDirs.includes(sortDir) ? sortDir : 'desc'

    const skip = (page - 1) * limit

    const [total, aggregateResult, expenses] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.aggregate({
        where,
        _sum: {
          amount: true
        }
      }),
      prisma.expense.findMany({
        where,
        include: {
          person: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: {
          [finalSortBy]: finalSortDir
        },
        skip,
        take: limit
      })
    ])

    return {
      expenses: expenses.map(e => ({
        id: e.id,
        date: e.date,
        description: e.description,
        amount: e.amount,
        personId: e.personId,
        person: e.person ? { id: e.person.id, name: e.person.name, avatar: e.person.avatar } : undefined,
        card: e.card,
        isManual: e.isManual,
        month: e.month,
        userId: e.userId,
        sharedStatus: e.sharedStatus,
        category: e.category,
        createdAt: e.createdAt,
        originalDescription: e.originalDescription,
        originalAmount: e.originalAmount,
        isPaid: e.isPaid,
      })) as any,
      total,
      totalAmount: aggregateResult._sum.amount || 0
    }
  }
}
