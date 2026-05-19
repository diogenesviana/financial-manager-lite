import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Set associated expenses' personId to null so they become unassigned/pending again
    await prisma.expense.updateMany({
      where: { personId: id },
      data: { personId: null },
    })

    // Delete the person
    await prisma.person.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao excluir pessoa:', error)
    return NextResponse.json({ error: 'Erro ao excluir pessoa: ' + error.message }, { status: 500 })
  }
}
