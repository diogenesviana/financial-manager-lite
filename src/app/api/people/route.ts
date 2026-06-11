import { NextResponse } from 'next/server'
import { PrismaPersonRepository } from '@/adapters/db/PrismaPersonRepository'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const personRepository = new PrismaPersonRepository()

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const people = await personRepository.findByUser(user.id)
    return NextResponse.json(people)
  } catch (error: any) {
    console.error('Erro ao buscar pessoas:', error)
    return NextResponse.json({ error: 'Erro ao buscar pessoas: ' + error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Verificar se já existe uma pessoa com o mesmo nome para este usuário
    const existingPeople = await personRepository.findByUser(user.id)
    const normalizedNewName = name.trim().toLowerCase()
    const isDuplicate = existingPeople.some(p => p.name.trim().toLowerCase() === normalizedNewName)
    if (isDuplicate) {
      return NextResponse.json({ error: 'Uma pessoa com este nome já está cadastrada.' }, { status: 400 })
    }

    const person = await personRepository.save({
      name: name.trim(),
      userId: user.id,
    })

    return NextResponse.json(person)
  } catch (error: any) {
    console.error('Erro ao criar pessoa:', error)
    return NextResponse.json({ error: 'Erro ao criar pessoa: ' + error.message }, { status: 500 })
  }
}
