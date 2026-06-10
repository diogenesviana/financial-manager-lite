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

    const rules = await prisma.assignmentRule.findMany({
      where: { userId: user.id },
      include: { person: true },
      orderBy: { keyword: 'asc' },
    })
    return NextResponse.json(rules)
  } catch (error: any) {
    console.error('GET RULES ERROR:', error)
    return NextResponse.json({ error: 'Erro ao buscar regras' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { keyword, personId } = body

    if (!keyword || !personId) {
      return NextResponse.json({ error: 'Palavra-chave e pessoa são obrigatórios' }, { status: 400 })
    }

    // Verify keyword is unique FOR THIS USER
    const existingRule = await prisma.assignmentRule.findFirst({
      where: {
        userId: user.id,
        keyword: keyword.toLowerCase().trim(),
      }
    })

    if (existingRule) {
      return NextResponse.json({ error: 'Essa palavra-chave já está cadastrada' }, { status: 409 })
    }

    const rule = await prisma.assignmentRule.create({
      data: {
        keyword: keyword.toLowerCase().trim(),
        personId,
        userId: user.id,
      },
      include: { person: true },
    })
    return NextResponse.json(rule)
  } catch (error: any) {
    console.error('POST RULE ERROR:', error)
    return NextResponse.json({ error: 'Erro ao criar regra' }, { status: 500 })
  }
}
