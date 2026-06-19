import { ExpenseRepository } from '@/core/domain/ports/ExpenseRepository'
import { Expense } from '@/core/domain/entities/Expense'
import prisma from '@/lib/prisma'

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
      createdAt: e.createdAt,
      originalDescription: e.originalDescription,
      originalAmount: e.originalAmount,
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
      person: e.person ? { id: e.person.id, name: e.person.name } : undefined,
      card: e.card,
      isManual: e.isManual,
      month: e.month,
      userId: e.userId,
      sharedStatus: e.sharedStatus,
      createdAt: e.createdAt,
      originalDescription: e.originalDescription,
      originalAmount: e.originalAmount,
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
      createdAt: e.createdAt,
      originalDescription: e.originalDescription,
      originalAmount: e.originalAmount,
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
    }

    let saved
    if (expense.id) {
      saved = await prisma.expense.update({
        where: { id: expense.id },
        data,
      })
    } else {
      saved = await prisma.expense.create({
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
      createdAt: saved.createdAt,
    }
  }

  async saveMany(expenses: Omit<Expense, 'id' | 'createdAt'>[]): Promise<void> {
    await prisma.expense.createMany({
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
      })),
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.expense.delete({
      where: { id },
    })
  }

  async clearAllByUser(userId: string): Promise<void> {
    await prisma.expense.deleteMany({
      where: { userId },
    })
  }

  async updatePerson(id: string, personId: string | null, sharedStatus?: string): Promise<void> {
    await prisma.expense.update({
      where: { id },
      data: { personId, ...(sharedStatus && { sharedStatus }) },
    })
  }

  async updateManyPerson(userId: string, fromPersonId: string, toPersonId: string | null): Promise<void> {
    await prisma.expense.updateMany({
      where: { userId, personId: fromPersonId },
      data: { personId: toPersonId },
    })
  }

  async updateMonth(id: string, month: string): Promise<void> {
    await prisma.expense.update({
      where: { id },
      data: { month },
    })
  }
}
