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
  } catch (error: any) {
    console.error('GET EXPENSES ERROR:', error)
    return NextResponse.json({ error: 'Erro ao buscar despesas', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    let parsedDate = new Date().toISOString()
    const monthRef = body.month || new Date().toISOString().substring(0, 7)
    const year = parseInt(monthRef.split('-')[0]) || new Date().getFullYear()
    const refMonth = parseInt(monthRef.split('-')[1]) || (new Date().getMonth() + 1)
    
    if (body.date && body.date.includes('/')) {
      const parts = body.date.split('/')
      const day = parseInt(parts[0])
      const month = parseInt(parts[1])
      parsedDate = new Date(year, month - 1, day, 12, 0, 0, 0).toISOString()
    } else if (body.date) {
      // Falback se já for uma string ISO ou outro formato
      parsedDate = new Date(body.date).toISOString()
    }

    // Verificar se já existe despesa idêntica (duplicada)
    const duplicate = await prisma.expense.findFirst({
      where: {
        date: parsedDate,
        description: body.description.trim(),
        amount: parseFloat(body.amount),
        month: body.month || '',
        card: body.card || null,
      }
    })

    if (duplicate) {
      return NextResponse.json(
        { error: 'Esta despesa já está cadastrada com os mesmos detalhes.' },
        { status: 409 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        date: parsedDate,
        description: body.description.trim(),
        amount: parseFloat(body.amount),
        personId: body.personId || null,
        card: body.card || null,
        month: body.month || '',
        isManual: true,
      },
    })
    return NextResponse.json(expense)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar despesa' }, { status: 500 })
  }
}
