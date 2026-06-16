import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar despesas cuja "Person" está vinculada e aceita pelo usuário atual, excluindo as que ele mesmo cadastrou
    const expenses = await prisma.expense.findMany({
      where: {
        person: {
          linkedUserId: user.id,
          linkStatus: 'ACCEPTED'
        },
        NOT: {
          userId: user.id
        },
        sharedStatus: {
          in: ['ACCEPTED', 'PENDING']
        }
      },
      include: {
        person: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Agrupar por dono + mês para exibir resumo consolidado
    const grouped: Record<string, { personName: string; ownerName: string; totalAmount: number; expenseCount: number; month: string; expenses: any[] }> = {}
    for (const exp of expenses) {
      const key = `${(exp as any).user?.email || 'unknown'}_${exp.month}`
      if (!grouped[key]) {
        grouped[key] = {
          personName: (exp as any).person?.name || '',
          ownerName: (exp as any).user?.name || 'Usuário',
          totalAmount: 0,
          expenseCount: 0,
          month: exp.month,
          expenses: []
        }
      }
      // Somar apenas gastos aceitos no total
      if (exp.sharedStatus === 'ACCEPTED') {
        grouped[key].totalAmount += exp.amount
      }
      grouped[key].expenseCount += 1
      grouped[key].expenses.push({
        id: exp.id,
        date: exp.date,
        description: exp.description,
        amount: exp.amount,
        card: exp.card,
        sharedStatus: exp.sharedStatus
      })
    }

    return NextResponse.json(Object.values(grouped))
  } catch (error: any) {
    console.error('Erro ao buscar despesas compartilhadas:', error)
    return NextResponse.json({ error: 'Erro ao buscar despesas compartilhadas: ' + error.message }, { status: 500 })
  }
}
