import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 })
    }

    const categories = await prisma.systemCategory.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Erro ao listar categorias (admin):', error)
    return NextResponse.json({ error: 'Erro ao listar categorias' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 })
    }

    const { name } = await request.json()
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'O nome da categoria é obrigatório' }, { status: 400 })
    }

    const trimmedName = name.trim()

    // Check duplication
    const existing = await prisma.systemCategory.findUnique({
      where: { name: trimmedName }
    })
    if (existing) {
      return NextResponse.json({ error: 'Esta categoria já existe' }, { status: 400 })
    }

    const newCategory = await prisma.systemCategory.create({
      data: { name: trimmedName }
    })

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 })
  }
}
