import { NextResponse } from 'next/server'
import { PrismaExpenseRepository } from '@/adapters/db/PrismaExpenseRepository'
import { getCurrentUser } from '@/lib/auth'
import prisma, { getAuditPrisma } from '@/lib/prisma'
import { resolveSharedStatusFromPerson } from '@/core/domain/services/SharedStatusService'
import { NotificationService } from '@/core/domain/services/NotificationService'

export const dynamic = 'force-dynamic'

const expenseRepository = new PrismaExpenseRepository()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const expense = await expenseRepository.findById(id)
    if (!expense || expense.userId !== user.id) {
      return NextResponse.json({ error: 'Despesa não encontrada ou não pertencente a este usuário' }, { status: 404 })
    }

    const { personId, month, isPaid } = await request.json()
    if (personId !== undefined) {
      let sharedStatus = 'ACCEPTED'
      if (personId !== null) {
        const p = await prisma.person.findUnique({ where: { id: personId } })
        sharedStatus = resolveSharedStatusFromPerson(p)
      }
      await expenseRepository.updatePerson(id, personId, sharedStatus)
      expense.personId = personId
    }
    if (month !== undefined) {
      await expenseRepository.updateMonth(id, month)
      expense.month = month
    }
    if (isPaid !== undefined) {
      await expenseRepository.updatePaid(id, isPaid)
      expense.isPaid = isPaid

      // Envia notificação para o devedor se o gasto for compartilhado e foi marcado como pago
      if (isPaid) {
        const expenseWithPerson = await prisma.expense.findUnique({
          where: { id },
          include: {
            person: true,
            user: { select: { name: true } }
          }
        })
        if (expenseWithPerson?.person?.linkedUserId) {
          await NotificationService.notifyExpensePaid(
            prisma,
            expenseWithPerson.description,
            user.name,
            expenseWithPerson.person.linkedUserId
          )
        }
      }

      // After updating individual expense status, check and sync the parent Person + Month status
      const currentExpense = await expenseRepository.findById(id)
      if (currentExpense && currentExpense.personId && currentExpense.month) {
        const pid = currentExpense.personId
        const m = currentExpense.month

        // Fetch all non-deleted expenses for this person in this month
        const personExpenses = await prisma.expense.findMany({
          where: {
            personId: pid,
            month: m,
            deletedAt: null
          }
        })

        if (personExpenses.length > 0) {
          // If all expenses are paid, the monthly status is true. Otherwise it is false.
          const allPaid = personExpenses.every(e => e.isPaid)
          await prisma.paymentStatus.upsert({
            where: {
              personId_month: { personId: pid, month: m }
            },
            update: { isPaid: allPaid },
            create: { personId: pid, month: m, isPaid: allPaid }
          })
        }
      }
    }

    return NextResponse.json(expense)
  } catch (error: any) {
    console.error('PATCH ERROR:', error)
    return NextResponse.json({ error: 'Erro ao atualizar despesa', details: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const expense = await prisma.expense.findUnique({ where: { id } })
    if (!expense || expense.userId !== user.id) {
      return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const { description, amount, category, card } = body

    if (expense.isManual && !description) {
      return NextResponse.json({ error: 'Descrição é obrigatória para gastos manuais' }, { status: 400 })
    }
    if (typeof amount !== 'number') {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    const updates: any = {}
    
    // Save original values if not set yet
    if (expense.originalDescription === null) {
      updates.originalDescription = expense.description
    }
    if (expense.originalAmount === null) {
      updates.originalAmount = expense.amount
    }

    if (!expense.isManual) {
      // For PDF expenses, format as OriginalName (NewName)
      const baseName = expense.originalDescription || expense.description
      if (description && description.trim().length > 0) {
        updates.description = `${baseName} (${description.trim()})`
      } else {
        updates.description = baseName
      }
    } else {
      updates.description = description.trim()
    }

    updates.amount = amount

    // Process category update
    if (category !== undefined) {
      updates.category = category || null
    } else {
      // Check for auto-categorization when description is updated
      if (updates.description) {
        const categoryRules = await prisma.categoryRule.findMany({
          where: { userId: user.id }
        })
        const descLower = updates.description.toLowerCase()
        const matchedCategoryRule = categoryRules.find(r =>
          descLower.includes(r.keyword.toLowerCase())
        )
        if (matchedCategoryRule) {
          updates.category = matchedCategoryRule.category
        }
      }
    }

    // Process card update (only for manual expenses)
    if (expense.isManual && card !== undefined) {
      updates.card = card || null
    }

    const auditPrisma = getAuditPrisma(user.id)
    const updatedExpense = await auditPrisma.expense.update({
      where: { id },
      data: updates
    })

    return NextResponse.json(updatedExpense)
  } catch (error: any) {
    console.error('PUT ERROR:', error)
    return NextResponse.json({ error: 'Erro ao atualizar despesa', details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const expense = await expenseRepository.findById(id)
    if (!expense || expense.userId !== user.id) {
      return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 })
    }

    await expenseRepository.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir despesa' }, { status: 500 })
  }
}
