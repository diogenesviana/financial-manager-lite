import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
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
      await prisma.expense.deleteMany({
        where: { personId: null },
      })
    } else if (type === 'assigned') {
      await prisma.expense.deleteMany({
        where: {
          NOT: { personId: null },
        },
      })
    } else if (type === 'reset_all') {
      await prisma.expense.deleteMany({})
      await prisma.person.deleteMany({})
    } else {
      await prisma.expense.deleteMany({})
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao limpar dados:', error)
    return NextResponse.json({ error: 'Erro ao limpar dados: ' + error.message }, { status: 500 })
  }
}
