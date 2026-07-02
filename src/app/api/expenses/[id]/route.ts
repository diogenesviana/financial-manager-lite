import { NextResponse } from 'next/server'
import { PrismaExpenseRepository } from '@/adapters/db/PrismaExpenseRepository'
import { getCurrentUser } from '@/lib/auth'
import prisma, { getAuditPrisma } from '@/lib/prisma'
import { resolveSharedStatusFromPerson } from '@/core/domain/services/SharedStatusService'
import { NotificationService } from '@/core/domain/services/NotificationService'
import { InstallmentService } from '@/core/domain/services/InstallmentService'

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

      // Cascade update do integrante para as outras parcelas do grupo (roda em background)
      if (expense.originalDescription) {
        cascadeInstallmentUpdates(user.id, {
          id,
          date: expense.date,
          description: expense.description,
          amount: expense.amount,
          card: expense.card,
          month: expense.month,
          personId,
          category: expense.category ?? null,
          sharedStatus,
          originalDescription: expense.originalDescription,
          originalAmount: expense.originalAmount ?? null,
        }, {
          personId,
          sharedStatus
        }).catch(err => console.error('[Cascade error in PATCH background]:', err))
      }
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
        if (expenseWithPerson?.person?.linkedUserId && expenseWithPerson.person.linkedUserId !== user.id) {
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
    const { description, amount, category, card, date, month } = body

    if (expense.isManual && !description) {
      return NextResponse.json({ error: 'Descrição é obrigatória para gastos manuais' }, { status: 400 })
    }
    if (typeof amount !== 'number') {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    const updates: any = {}

    if (date) {
      const parsedDate = new Date(date)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
      }
      updates.date = parsedDate
      if (!month) {
        const matchedMonth = date.match(/^\d{4}-\d{2}/)
        updates.month = matchedMonth ? matchedMonth[0] : parsedDate.toISOString().substring(0, 7)
      }
    }

    if (month) {
      updates.month = month
    }
    
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

    const pid = expense.personId
    const oldMonth = expense.month
    const newMonth = updates.month || oldMonth

    const auditPrisma = getAuditPrisma(user.id)
    const updatedExpense = await auditPrisma.expense.update({
      where: { id },
      data: updates
    })

    // Cascade update da descrição/categoria para as outras parcelas do grupo (roda em background)
    const baseOrigDesc = updatedExpense.originalDescription || expense.originalDescription
    if (baseOrigDesc) {
      const cascadeUpdates: any = {}
      if (category !== undefined) {
        cascadeUpdates.category = category || null
      }
      if (description !== undefined) {
        cascadeUpdates.description = description.trim()
      }
      
      if (Object.keys(cascadeUpdates).length > 0) {
        cascadeInstallmentUpdates(user.id, {
          id,
          date: updatedExpense.date,
          description: updatedExpense.description,
          amount: updatedExpense.amount,
          card: updatedExpense.card,
          month: updatedExpense.month,
          personId: updatedExpense.personId,
          category: updatedExpense.category,
          sharedStatus: updatedExpense.sharedStatus,
          originalDescription: baseOrigDesc,
          originalAmount: updatedExpense.originalAmount,
        }, cascadeUpdates).catch(err => console.error('[Cascade error in PUT background]:', err))
      }
    }

    if (pid && (oldMonth !== newMonth)) {
      // Sincroniza o status de pagamento do mês antigo
      const oldMonthExpenses = await prisma.expense.findMany({
        where: { personId: pid, month: oldMonth, deletedAt: null }
      })
      if (oldMonthExpenses.length > 0) {
        const oldAllPaid = oldMonthExpenses.every(e => e.isPaid)
        await prisma.paymentStatus.upsert({
          where: { personId_month: { personId: pid, month: oldMonth } },
          update: { isPaid: oldAllPaid },
          create: { personId: pid, month: oldMonth, isPaid: oldAllPaid }
        })
      } else {
        await prisma.paymentStatus.deleteMany({
          where: { personId: pid, month: oldMonth }
        })
      }

      // Sincroniza o status de pagamento do novo mês
      const newMonthExpenses = await prisma.expense.findMany({
        where: { personId: pid, month: newMonth, deletedAt: null }
      })
      if (newMonthExpenses.length > 0) {
        const newAllPaid = newMonthExpenses.every(e => e.isPaid)
        await prisma.paymentStatus.upsert({
          where: { personId_month: { personId: pid, month: newMonth } },
          update: { isPaid: newAllPaid },
          create: { personId: pid, month: newMonth, isPaid: newAllPaid }
        })
      }
    }

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

async function cascadeInstallmentUpdates(
  userId: string,
  mainExpense: {
    id: string
    date: Date
    description: string
    amount: number
    card: string | null
    month: string
    personId: string | null
    category: string | null
    sharedStatus: string
    originalDescription: string | null
    originalAmount: number | null
  },
  updates: {
    description?: string
    category?: string | null
    personId?: string | null
    sharedStatus?: string
  }
) {
  try {
    const { originalDescription, amount, card, month, date, id: mainId } = mainExpense
    if (!originalDescription) return

    const installment = InstallmentService.parseInstallment(originalDescription)
    if (!installment) return

    const { current, total, matchedText, originalRoot } = installment

    // 1. Buscar todas as outras parcelas ativas desse mesmo parcelamento que já existem no banco
    const siblings = await prisma.expense.findMany({
      where: {
        userId,
        card,
        deletedAt: null,
        id: { not: mainId },
        OR: [
          { amount: { equals: amount } },
          { originalAmount: { equals: amount } }
        ]
      }
    })

    // Filtrar siblings válidos pelo nome e mês correspondente
    const existingSiblings = siblings.filter(sib => {
      const sibDesc = sib.originalDescription || sib.description
      const sibInstallment = InstallmentService.parseInstallment(sibDesc)
      if (!sibInstallment || sibInstallment.total !== total) return false
      if (sibInstallment.originalRoot.toLowerCase() !== originalRoot.toLowerCase()) return false

      const diffMonths = sibInstallment.current - current
      const expectedMonth = InstallmentService.addMonthsToMonthString(month, diffMonths)
      return sib.month === expectedMonth
    })

    // Determinar dados atuais de atribuição/categoria (considerando atualizações ou valores herdados da despesa principal)
    const activePersonId = updates.personId !== undefined ? updates.personId : mainExpense.personId
    const activeCategory = updates.category !== undefined ? updates.category : mainExpense.category
    const activeSharedStatus = updates.sharedStatus !== undefined ? updates.sharedStatus : mainExpense.sharedStatus

    // 2. Se a despesa estiver atribuída a um integrante, identificar e gerar parcelas ausentes
    if (activePersonId !== null) {
      const newExpensesData: any[] = []

      for (let i = 1; i <= total; i++) {
        if (i === current) continue

        // Verificar se essa parcela já existe no banco
        const alreadyExists = existingSiblings.some(sib => {
          const sibDesc = sib.originalDescription || sib.description
          const sibInstallment = InstallmentService.parseInstallment(sibDesc)
          return sibInstallment?.current === i
        })

        if (!alreadyExists) {
          const diffMonths = i - current
          const installmentDate = new Date(date)
          installmentDate.setMonth(installmentDate.getMonth() + diffMonths)

          const installmentMonth = InstallmentService.addMonthsToMonthString(month, diffMonths)
          const installmentDesc = InstallmentService.generateDescription(
            originalDescription,
            matchedText,
            i
          )

          // Se a despesa principal tiver uma descrição amigável renomeada
          // Ex: "MERCADOLIVRE Parcela 3 de 12 (Celular)"
          // Nós vamos extrair a descrição amigável digitada pelo usuário
          let friendlyDesc = ''
          if (updates.description) {
            friendlyDesc = InstallmentService.cleanInstallmentText(updates.description)
          } else {
            const parenMatch = mainExpense.description.match(/\(([^)]+)\)/)
            if (parenMatch) {
              friendlyDesc = parenMatch[1].trim()
            }
          }

          const finalDesc = friendlyDesc
            ? `${installmentDesc} (${friendlyDesc})`
            : installmentDesc

          newExpensesData.push({
            userId,
            date: installmentDate,
            description: finalDesc,
            amount,
            originalAmount: amount,
            card,
            isManual: false,
            month: installmentMonth,
            personId: activePersonId,
            category: activeCategory,
            sharedStatus: activeSharedStatus,
            originalDescription: installmentDesc,
          })
        }
      }

      if (newExpensesData.length > 0) {
        await prisma.expense.createMany({
          data: newExpensesData
        })
      }
    }

    // 3. Atualizar as parcelas que já existem
    const updatePromises = existingSiblings.map(sib => {
      const sibUpdates: any = {}

      if (updates.category !== undefined) {
        sibUpdates.category = updates.category
      }

      if (updates.personId !== undefined) {
        sibUpdates.personId = updates.personId
        sibUpdates.sharedStatus = updates.sharedStatus || 'ACCEPTED'
      }

      if (updates.description !== undefined) {
        const sibDesc = sib.originalDescription || sib.description
        const sibInstallment = InstallmentService.parseInstallment(sibDesc)

        if (sibInstallment) {
          const newBaseDesc = InstallmentService.cleanInstallmentText(updates.description)

          if (!sib.isManual) {
            sibUpdates.description = `${sibDesc} (${newBaseDesc})`
          } else {
            const replacedMatchedText = sibInstallment.matchedText.replace(/\d+/, String(sibInstallment.current))
            sibUpdates.description = `${newBaseDesc} ${replacedMatchedText}`
          }
        }
      }

      if (Object.keys(sibUpdates).length > 0) {
        const auditPrisma = getAuditPrisma(userId)
        return auditPrisma.expense.update({
          where: { id: sib.id },
          data: sibUpdates
        })
      }

      return Promise.resolve()
    })

    await Promise.all(updatePromises)
  } catch (error) {
    console.error('[cascadeInstallmentUpdates error]:', error)
  }
}
