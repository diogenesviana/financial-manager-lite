import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('GET /api/people')
  try {
    const people = await prisma.person.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(people)
  } catch (error: any) {
    console.error('Erro ao buscar pessoas:', error)
    return NextResponse.json({ error: 'Erro ao buscar pessoas: ' + error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const person = await prisma.person.create({
      data: {
        name: name.trim(),
      },
    })

    return NextResponse.json(person)
  } catch (error: any) {
    console.error('Erro ao criar pessoa:', error)
    return NextResponse.json({ error: 'Erro ao criar pessoa: ' + error.message }, { status: 500 })
  }
}
