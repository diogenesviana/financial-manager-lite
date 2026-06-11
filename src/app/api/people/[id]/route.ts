import { NextResponse } from 'next/server'
import { PrismaPersonRepository } from '@/adapters/db/PrismaPersonRepository'
import { PrismaExpenseRepository } from '@/adapters/db/PrismaExpenseRepository'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

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

export async function PUT(
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

    const body = await request.json()
    const { name, phone, inviteEmail } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Check duplicate name
    if (name.trim().toLowerCase() !== person.name.toLowerCase()) {
      const existingPeople = await personRepository.findByUser(user.id)
      const isDuplicate = existingPeople.some(p => p.id !== id && p.name.trim().toLowerCase() === name.trim().toLowerCase())
      if (isDuplicate) {
        return NextResponse.json({ error: 'Uma pessoa com este nome já está cadastrada.' }, { status: 400 })
      }
    }

    let linkedUserId = person.linkedUserId
    let linkStatus = person.linkStatus
    let inviteEmailVal = person.inviteEmail

    const normalizedInviteEmail = inviteEmail ? inviteEmail.trim().toLowerCase() : null
    const currentInviteEmail = person.inviteEmail ? person.inviteEmail.toLowerCase() : null

    if (normalizedInviteEmail !== currentInviteEmail) {
      if (!normalizedInviteEmail) {
        linkedUserId = null
        linkStatus = 'NONE'
        inviteEmailVal = null
      } else {
        if (normalizedInviteEmail === user.email.toLowerCase()) {
          return NextResponse.json({ error: 'Você não pode convidar a si mesmo.' }, { status: 400 })
        }
        linkStatus = 'PENDING'
        inviteEmailVal = normalizedInviteEmail
        const targetUser = await prisma.user.findUnique({
          where: { email: normalizedInviteEmail }
        })
        if (targetUser) {
          linkedUserId = targetUser.id
        } else {
          linkedUserId = null
        }
      }
    }

    const updated = await personRepository.save({
      id,
      name: name.trim(),
      userId: user.id,
      phone: phone ? phone.trim() : null,
      linkedUserId,
      linkStatus: linkStatus || 'NONE',
      inviteEmail: inviteEmailVal
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Erro ao editar pessoa:', error)
    return NextResponse.json({ error: 'Erro ao editar pessoa: ' + error.message }, { status: 500 })
  }
}
