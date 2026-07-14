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

    const banks = await prisma.systemBank.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(banks)
  } catch (error) {
    console.error('Erro ao listar bancos (admin):', error)
    return NextResponse.json({ error: 'Erro ao listar bancos' }, { status: 500 })
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
      return NextResponse.json({ error: 'O nome do banco/cartão é obrigatório' }, { status: 400 })
    }

    const trimmedName = name.trim()

    // Check duplication
    const existing = await prisma.systemBank.findUnique({
      where: { name: trimmedName }
    })
    if (existing) {
      return NextResponse.json({ error: 'Este banco/cartão já existe' }, { status: 400 })
    }

    const newBank = await prisma.systemBank.create({
      data: { name: trimmedName }
    })

    return NextResponse.json(newBank, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar banco/cartão:', error)
    return NextResponse.json({ error: 'Erro ao criar banco/cartão' }, { status: 500 })
  }
}
