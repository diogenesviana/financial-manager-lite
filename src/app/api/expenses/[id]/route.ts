import { NextResponse } from 'next/server'
import { PrismaExpenseRepository } from '@/adapters/db/PrismaExpenseRepository'
import { getCurrentUser } from '@/lib/auth'

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

    const { personId, month } = await request.json()
    if (personId !== undefined) {
      await expenseRepository.updatePerson(id, personId)
      expense.personId = personId
    }
    if (month !== undefined) {
      await expenseRepository.updateMonth(id, month)
      expense.month = month
    }

    return NextResponse.json(expense)
  } catch (error: any) {
    console.error('PATCH ERROR:', error)
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
