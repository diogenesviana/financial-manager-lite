import { NextResponse } from 'next/server'
import { PrismaExpenseRepository } from '@/adapters/db/PrismaExpenseRepository'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { resolveSharedStatusFromPerson } from '@/core/domain/services/SharedStatusService'

export const dynamic = 'force-dynamic'

const expenseRepository = new PrismaExpenseRepository()

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || new Date().toISOString().substring(0, 7)

    const expenses = await expenseRepository.findByUserAndMonth(user.id, month)
    return NextResponse.json(expenses)
  } catch (error: any) {
    console.error('GET EXPENSES ERROR:', error)
    return NextResponse.json({ error: 'Erro ao buscar despesas', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
 
    let parsedDate = new Date().toISOString()
    const monthRef = body.month || new Date().toISOString().substring(0, 7)
    const year = parseInt(monthRef.split('-')[0]) || new Date().getFullYear()
    
    if (body.date && body.date.includes('/')) {
      const parts = body.date.split('/')
      const day = parseInt(parts[0])
      const month = parseInt(parts[1])
      parsedDate = new Date(year, month - 1, day, 12, 0, 0, 0).toISOString()
    } else if (body.date) {
      parsedDate = new Date(body.date).toISOString()
    }
 
    const resolvedMonth = body.month || new Date(parsedDate).toISOString().substring(0, 7)
 
    // Verificar se já existe despesa idêntica (duplicada) para este usuário
    const duplicate = await expenseRepository.findDuplicate(user.id, {
      date: new Date(parsedDate),
      description: body.description.trim(),
      amount: parseFloat(body.amount),
      month: resolvedMonth,
      card: body.card || null,
      isManual: true,
    })
 
    if (duplicate) {
      return NextResponse.json(
        { error: 'Esta despesa já está cadastrada com os mesmos detalhes.' },
        { status: 409 }
      )
    }
 
    let sharedStatus = 'ACCEPTED'
    if (body.personId) {
      const p = await prisma.person.findUnique({ where: { id: body.personId } })
      sharedStatus = resolveSharedStatusFromPerson(p)
    }

    // Auto-categorize based on user's category rules
    const categoryRules = await prisma.categoryRule.findMany({
      where: { userId: user.id }
    })
    const descLower = body.description.trim().toLowerCase()
    const matchedCategoryRule = categoryRules.find(r =>
      descLower.includes(r.keyword.toLowerCase())
    )
    const category = matchedCategoryRule ? matchedCategoryRule.category : 'Outros'

    const expense = await expenseRepository.save({
      date: new Date(parsedDate),
      description: body.description.trim(),
      amount: parseFloat(body.amount),
      personId: body.personId || null,
      card: body.card || null,
      month: resolvedMonth,
      isManual: true,
      userId: user.id,
      sharedStatus,
      category
    })

    return NextResponse.json(expense)
  } catch (error: any) {
    console.error('POST EXPENSE ERROR:', error)
    return NextResponse.json({ error: 'Erro ao criar despesa' }, { status: 500 })
  }
}
