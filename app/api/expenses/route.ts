import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: { person: true },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(expenses)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar despesas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const expense = await prisma.expense.create({
      data: {
        date: body.date,
        description: body.description,
        amount: parseFloat(body.amount),
        personId: body.personId || null,
        month: body.month || '',
        isManual: true,
      },
    })
    return NextResponse.json(expense)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar despesa' }, { status: 500 })
  }
}
