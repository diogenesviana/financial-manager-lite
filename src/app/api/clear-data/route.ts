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

    if (type === 'unassign_all') {
      await prisma.expense.updateMany({
        where: { userId: user.id },
        data: { personId: null }
      })
    } else if (type === 'all_expenses') {
      await prisma.expense.deleteMany({
        where: { userId: user.id }
      })
    } else if (type === 'all_people') {
      await prisma.person.deleteMany({
        where: {
          userId: user.id,
          OR: [
            { linkedUserId: null },
            {
              linkedUserId: {
                not: user.id
              }
            }
          ]
        }
      })
    } else if (type === 'all_rules') {
      await prisma.assignmentRule.deleteMany({
        where: { userId: user.id }
      })
    } else if (type === 'reset_all') {
      // Deletar despesas
      await prisma.expense.deleteMany({ 
        where: { userId: user.id }
      })
      // Deletar regras de atribuição
      await prisma.assignmentRule.deleteMany({
        where: { userId: user.id }
      })
      // Deletar integrantes exceto o próprio usuário
      await prisma.person.deleteMany({ 
        where: { 
          userId: user.id,
          OR: [
            { linkedUserId: null },
            {
              linkedUserId: {
                not: user.id
              }
            }
          ]
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao limpar dados:', error)
    return NextResponse.json({ error: 'Erro ao limpar dados: ' + error.message }, { status: 500 })
  }
}
