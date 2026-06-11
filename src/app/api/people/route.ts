import { NextResponse } from 'next/server'
import { PrismaPersonRepository } from '@/adapters/db/PrismaPersonRepository'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
    const { name, phone, inviteEmail } = body

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

    let linkedUserId: string | null = null
    let linkStatus = 'NONE'
    let normalizedInviteEmail: string | null = null

    if (inviteEmail && typeof inviteEmail === 'string' && inviteEmail.trim()) {
      normalizedInviteEmail = inviteEmail.trim().toLowerCase()
      // Evitar convidar a si mesmo
      if (normalizedInviteEmail === user.email.toLowerCase()) {
        return NextResponse.json({ error: 'Você não pode convidar a si mesmo.' }, { status: 400 })
      }

      linkStatus = 'PENDING'
      // Buscar se o usuário já existe
      const targetUser = await prisma.user.findUnique({
        where: { email: normalizedInviteEmail }
      })
      if (targetUser) {
        linkedUserId = targetUser.id
      }
    }

    const person = await personRepository.save({
      name: name.trim(),
      userId: user.id,
      phone: phone ? phone.trim() : null,
      linkedUserId,
      linkStatus,
      inviteEmail: normalizedInviteEmail
    })

    return NextResponse.json(person)
  } catch (error: any) {
    console.error('Erro ao criar pessoa:', error)
    return NextResponse.json({ error: 'Erro ao criar pessoa: ' + error.message }, { status: 500 })
  }
}
