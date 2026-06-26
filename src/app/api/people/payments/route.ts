import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PrismaExpenseRepository } from '@/adapters/db/PrismaExpenseRepository'
import { NotificationService } from '@/core/domain/services/NotificationService'

export const dynamic = 'force-dynamic'

const expenseRepository = new PrismaExpenseRepository()

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    if (!month) return NextResponse.json({ error: 'Mês é obrigatório' }, { status: 400 })

    const statuses = await prisma.paymentStatus.findMany({
      where: {
        month,
        person: {
          userId: user.id
        }
      }
    })
    return NextResponse.json(statuses)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { personId, month, isPaid } = await request.json()
    if (!personId || !month) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

    const person = await prisma.person.findFirst({
      where: { id: personId, userId: user.id }
    })
    if (!person) return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 })

    const status = await prisma.paymentStatus.upsert({
      where: {
        personId_month: { personId, month }
      },
      update: { isPaid },
      create: { personId, month, isPaid }
    })

    // Propagate monthly status to individual expenses
    await expenseRepository.updateManyPaid(user.id, personId, month, isPaid)

    // Envia notificação para o devedor se houver usuário vinculado e for marcado como pago
    if (isPaid && person.linkedUserId) {
      await NotificationService.notifyMonthPaid(
        prisma,
        month,
        user.name,
        person.linkedUserId
      )
    }

    return NextResponse.json(status)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
