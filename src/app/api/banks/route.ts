import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const DEFAULT_BANKS = [
  'Nubank',
  'Inter',
  'Itaú',
  'Bradesco',
  'Santander',
  'C6 Bank',
  'Caixa',
  'Banco do Brasil',
  'Flash',
  'Sodexo',
  'Caju'
]

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let banks = await prisma.systemBank.findMany({
      orderBy: { name: 'asc' }
    })

    if (banks.length === 0) {
      // Auto-seed default banks
      await prisma.$transaction(
        DEFAULT_BANKS.map(name => 
          prisma.systemBank.upsert({
            where: { name },
            update: {},
            create: { name }
          })
        )
      )

      banks = await prisma.systemBank.findMany({
        orderBy: { name: 'asc' }
      })
    }

    return NextResponse.json(banks.map(b => b.name))
  } catch (error) {
    console.error('Erro ao buscar bancos:', error)
    return NextResponse.json({ error: 'Erro ao buscar bancos' }, { status: 500 })
  }
}
