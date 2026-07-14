import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const DEFAULT_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Moradia',
  'Casa',
  'Assinaturas',
  'Educação',
  'Vestuário',
  'Viagem',
  'Outros'
]

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let categories = await prisma.systemCategory.findMany({
      orderBy: { name: 'asc' }
    })

    if (categories.length === 0) {
      // Auto-seed default categories
      await prisma.$transaction(
        DEFAULT_CATEGORIES.map(name => 
          prisma.systemCategory.upsert({
            where: { name },
            update: {},
            create: { name }
          })
        )
      )

      categories = await prisma.systemCategory.findMany({
        orderBy: { name: 'asc' }
      })
    }

    return NextResponse.json(categories.map(c => c.name))
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
  }
}
