import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let type = 'all_expenses'
    try {
      const body = await request.json()
      if (body && body.type) {
        type = body.type
      }
    } catch {
      // Default fallback
    }

    if (type === 'unassigned') {
      await prisma.expense.updateMany({
        where: { userId: user.id, personId: null, deletedAt: null },
        data: { deletedAt: new Date() }
      })
    } else if (type === 'assigned') {
      await prisma.expense.updateMany({
        where: {
          userId: user.id,
          NOT: { personId: null },
          deletedAt: null
        },
        data: { deletedAt: new Date() }
      })
    } else if (type === 'reset_all') {
      await prisma.expense.updateMany({ 
        where: { userId: user.id, deletedAt: null },
        data: { deletedAt: new Date() }
      })
      await prisma.person.deleteMany({ where: { userId: user.id } })
    } else {
      await prisma.expense.updateMany({ 
        where: { userId: user.id, deletedAt: null },
        data: { deletedAt: new Date() }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao limpar dados:', error)
    return NextResponse.json({ error: 'Erro ao limpar dados: ' + error.message }, { status: 500 })
  }
}
