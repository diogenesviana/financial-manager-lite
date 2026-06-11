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

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { phone: true, name: true, email: true }
    })

    if (dbUser && dbUser.phone) {
      // Garantir que existe o integrante referente a si mesmo
      const existingSelfPerson = await prisma.person.findFirst({
        where: {
          userId: user.id,
          linkedUserId: user.id
        }
      })
      if (!existingSelfPerson) {
        await prisma.person.create({
          data: {
            name: dbUser.name,
            phone: dbUser.phone,
            userId: user.id,
            linkedUserId: user.id,
            linkStatus: 'ACCEPTED',
            inviteEmail: dbUser.email.toLowerCase()
          }
        })
      }
    }

    const people = await prisma.person.findMany({
      where: { userId: user.id },
      include: {
        linkedUser: {
          select: {
            phone: true
          }
        }
      },
      orderBy: { name: 'asc' },
    })

    const mapped = people.map(p => ({
      id: p.id,
      name: p.name,
      userId: p.userId,
      phone: p.linkedUser?.phone || p.phone,
      linkedUserId: p.linkedUserId,
      linkStatus: p.linkStatus,
      inviteEmail: p.inviteEmail,
      createdAt: p.createdAt,
    }))

    return NextResponse.json(mapped)
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
    const { name, phone, inviteEmail, isSystemUser } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Verificar se já existe uma pessoa com o mesmo nome para este usuário
    const existingPeople = await prisma.person.findMany({ where: { userId: user.id } })
    const normalizedNewName = name.trim().toLowerCase()
    const isDuplicate = existingPeople.some(p => p.name.trim().toLowerCase() === normalizedNewName)
    if (isDuplicate) {
      return NextResponse.json({ error: 'Uma pessoa com este nome já está cadastrada.' }, { status: 400 })
    }

    let linkedUserId: string | null = null
    let linkStatus = 'NONE'
    let normalizedInviteEmail: string | null = null
    let finalPhone: string | null = phone ? phone.replace(/\D/g, '') : null

    if (isSystemUser) {
      if (!inviteEmail || typeof inviteEmail !== 'string' || !inviteEmail.trim()) {
        return NextResponse.json({ error: 'E-mail de convite é obrigatório para membros do sistema.' }, { status: 400 })
      }
      normalizedInviteEmail = inviteEmail.trim().toLowerCase()
      // Evitar convidar a si mesmo
      if (normalizedInviteEmail === user.email.toLowerCase()) {
        return NextResponse.json({ error: 'Você não pode convidar a si mesmo.' }, { status: 400 })
      }

      linkStatus = 'PENDING'
      finalPhone = null // O telefone virá dinamicamente da conta do usuário quando ele aceitar/vincular
      
      // Buscar se o usuário já existe
      const targetUser = await prisma.user.findUnique({
        where: { email: normalizedInviteEmail }
      })
      if (targetUser) {
        linkedUserId = targetUser.id
      }
    }

    const person = await prisma.person.create({
      data: {
        name: name.trim(),
        userId: user.id,
        phone: finalPhone,
        linkedUserId,
        linkStatus,
        inviteEmail: normalizedInviteEmail
      }
    })

    return NextResponse.json(person)
  } catch (error: any) {
    console.error('Erro ao criar pessoa:', error)
    return NextResponse.json({ error: 'Erro ao criar pessoa: ' + error.message }, { status: 500 })
  }
}
