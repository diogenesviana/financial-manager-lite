import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(request: Request) {
  try {
    const sessionUser = await getCurrentUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { phone } = await request.json()

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 })
    }

    const cleanedPhone = phone.replace(/\D/g, '')
    if (cleanedPhone.length < 10) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }

    // Update user phone number
    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data: { phone: cleanedPhone },
    })

    // Check if the user already has a self-referencing Person created
    const existingSelfPerson = await prisma.person.findFirst({
      where: {
        userId: sessionUser.id,
        OR: [
          { linkedUserId: sessionUser.id },
          { inviteEmail: sessionUser.email.toLowerCase() }
        ]
      }
    })

    if (!existingSelfPerson) {
      // Create new self-person
      await prisma.person.create({
        data: {
          name: sessionUser.name,
          phone: cleanedPhone,
          userId: sessionUser.id,
          linkedUserId: sessionUser.id,
          linkStatus: 'ACCEPTED',
          inviteEmail: sessionUser.email.toLowerCase(),
        }
      })
    } else {
      // Keep existing person's phone, email and status in sync
      await prisma.person.update({
        where: { id: existingSelfPerson.id },
        data: {
          phone: cleanedPhone,
          linkedUserId: sessionUser.id,
          linkStatus: 'ACCEPTED',
          inviteEmail: sessionUser.email.toLowerCase(),
        }
      })
    }

    return NextResponse.json({ success: true, user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, role: updatedUser.role, phone: updatedUser.phone } })
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil: ' + error.message }, { status: 500 })
  }
}
