import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const rule = await prisma.categoryRule.findUnique({ where: { id } })
    if (!rule || rule.userId !== user.id) {
      return NextResponse.json({ error: 'Regra de categoria não encontrada' }, { status: 404 })
    }

    await prisma.categoryRule.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE CATEGORY RULE ERROR:', error)
    return NextResponse.json({ error: 'Erro ao excluir regra de categoria' }, { status: 500 })
  }
}
