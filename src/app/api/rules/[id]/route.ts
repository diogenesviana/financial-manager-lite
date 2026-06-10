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

    const rule = await prisma.assignmentRule.findUnique({ where: { id } })
    if (!rule || rule.userId !== user.id) {
      return NextResponse.json({ error: 'Regra não encontrada' }, { status: 404 })
    }

    await prisma.assignmentRule.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE RULE ERROR:', error)
    return NextResponse.json({ error: 'Erro ao excluir regra' }, { status: 500 })
  }
}
