import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rules = await prisma.assignmentRule.findMany({
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
    const body = await request.json()
    const { keyword, personId } = body

    if (!keyword || !personId) {
      return NextResponse.json({ error: 'Palavra-chave e pessoa são obrigatórios' }, { status: 400 })
    }

    const rule = await prisma.assignmentRule.create({
      data: {
        keyword: keyword.toLowerCase().trim(),
        personId,
      },
      include: { person: true },
    })
    return NextResponse.json(rule)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Essa palavra-chave já está cadastrada' }, { status: 409 })
    }
    console.error('POST RULE ERROR:', error)
    return NextResponse.json({ error: 'Erro ao criar regra' }, { status: 500 })
  }
}
