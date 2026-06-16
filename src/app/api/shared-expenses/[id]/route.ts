import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT: Aceitar ou recusar um gasto compartilhado
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

    const { action } = await request.json()
    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    // O gasto pertence ao User A (dono), mas o User B (logado) quer aceitar/recusar
    // Precisamos achar o gasto e garantir que ele foi atribuído a uma Person vinculada ao User B.
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { person: true }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Gasto não encontrado' }, { status: 404 })
    }

    if (expense.person?.linkedUserId !== user.id) {
      return NextResponse.json({ error: 'Não autorizado a alterar este gasto' }, { status: 403 })
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        sharedStatus: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED'
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Erro ao atualizar status do gasto compartilhado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
