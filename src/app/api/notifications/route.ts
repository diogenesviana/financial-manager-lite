import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: Buscar notificações não lidas
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, isRead: false },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT: Marcar notificação como lida
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 })
    }

    const updated = await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao atualizar notificação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
