import { NextResponse } from 'next/server'
import { PrismaPersonRepository } from '@/adapters/db/PrismaPersonRepository'
import { PrismaExpenseRepository } from '@/adapters/db/PrismaExpenseRepository'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const personRepository = new PrismaPersonRepository()
const expenseRepository = new PrismaExpenseRepository()

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

    const person = await personRepository.findById(id)
    if (!person || person.userId !== user.id) {
      return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 })
    }

    // Set associated expenses' personId to null so they become unassigned/pending again
    await expenseRepository.updateManyPerson(user.id, id, null)

    // Delete the person
    await personRepository.delete(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao excluir pessoa:', error)
    return NextResponse.json({ error: 'Erro ao excluir pessoa: ' + error.message }, { status: 500 })
  }
}
