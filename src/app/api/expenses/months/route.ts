import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const monthsGroup = await prisma.expense.groupBy({
      by: ['month'],
      where: {
        userId: user.id,
        deletedAt: null
      },
      orderBy: {
        month: 'desc'
      }
    })

    const months = monthsGroup.map(g => g.month).filter(Boolean)
    return NextResponse.json(months)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
