import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST: Limpar todo o sistema, exceto o usuário logado (Admin)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas admins podem limpar o sistema
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Ação permitida apenas para administradores' }, { status: 403 })
    }

    // Deletar os dados na ordem correta para não ferir restrições de chave estrangeira
    await prisma.expense.deleteMany({})
    await prisma.assignmentRule.deleteMany({})
    await prisma.person.deleteMany({})
    
    // Deletar todos os usuários exceto o admin atual
    await prisma.user.deleteMany({
      where: {
        id: {
          not: user.id
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao limpar o sistema:', error)
    return NextResponse.json({ error: 'Erro ao limpar o sistema: ' + error.message }, { status: 500 })
  }
}
