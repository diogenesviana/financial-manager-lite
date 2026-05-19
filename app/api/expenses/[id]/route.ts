import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { personId } = await request.json()
    const expense = await prisma.expense.update({
      where: { id },
      data: { personId },
    })
    return NextResponse.json(expense)
  } catch (error: any) {
    console.error('PATCH ERROR:', error)
    return NextResponse.json({ error: 'Erro ao atualizar despesa', details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.expense.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir despesa' }, { status: 500 })
  }
}
