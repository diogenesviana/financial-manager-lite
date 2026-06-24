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

    const rules = await prisma.categoryRule.findMany({
      where: { userId: user.id },
      orderBy: { keyword: 'asc' },
    })
    return NextResponse.json(rules)
  } catch (error: any) {
    console.error('GET CATEGORY RULES ERROR:', error)
    return NextResponse.json({ error: 'Erro ao buscar regras de categoria' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { keyword, category } = body

    if (!keyword || !category) {
      return NextResponse.json({ error: 'Palavra-chave e categoria são obrigatórios' }, { status: 400 })
    }

    // Verify keyword is unique FOR THIS USER
    const existingRule = await prisma.categoryRule.findFirst({
      where: {
        userId: user.id,
        keyword: keyword.toLowerCase().trim(),
      }
    })

    if (existingRule) {
      return NextResponse.json({ error: 'Essa palavra-chave já está cadastrada para uma categoria' }, { status: 409 })
    }

    const rule = await prisma.categoryRule.create({
      data: {
        keyword: keyword.toLowerCase().trim(),
        category,
        userId: user.id,
      }
    })
    return NextResponse.json(rule)
  } catch (error: any) {
    console.error('POST CATEGORY RULE ERROR:', error)
    return NextResponse.json({ error: 'Erro ao criar regra de categoria' }, { status: 500 })
  }
}
