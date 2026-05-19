import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.assignmentRule.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE RULE ERROR:', error)
    return NextResponse.json({ error: 'Erro ao excluir regra' }, { status: 500 })
  }
}
