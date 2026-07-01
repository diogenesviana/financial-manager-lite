import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Busca descrições das últimas 200 despesas do usuário
    const expenses = await prisma.expense.findMany({
      where: { userId: user.id },
      select: { description: true },
      orderBy: { date: 'desc' },
      take: 200,
    })

    // Extrai as descrições únicas mantendo a ordem cronológica reversa
    const uniqueDescriptions: string[] = []
    const seen = new Set<string>()

    for (const exp of expenses) {
      const desc = exp.description.trim()
      if (desc && !seen.has(desc.toLowerCase())) {
        seen.add(desc.toLowerCase())
        uniqueDescriptions.push(desc)
      }
    }

    // Retorna as 50 descrições mais recentes e únicas
    return NextResponse.json(uniqueDescriptions.slice(0, 50))
  } catch (error: any) {
    console.error('GET EXPENSE SUGGESTIONS ERROR:', error)
    return NextResponse.json({ error: 'Erro ao buscar sugestões' }, { status: 500 })
  }
}
