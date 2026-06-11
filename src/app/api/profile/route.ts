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

    const { name, phone, avatar } = await request.json()
    const updateData: any = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string' || !phone.trim()) {
        return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 })
      }
      const cleanedPhone = phone.replace(/\D/g, '')
      if (cleanedPhone.length < 10) {
        return NextResponse.json({ error: 'Telefone inválido. Digite DDD + Número.' }, { status: 400 })
      }
      updateData.phone = cleanedPhone
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum dado fornecido para atualização' }, { status: 400 })
    }

    // Update user name and/or phone number
    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data: updateData,
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

    const personData: any = {
      linkedUserId: sessionUser.id,
      linkStatus: 'ACCEPTED',
      inviteEmail: sessionUser.email.toLowerCase(),
    }
    if (updatedUser.name) {
      personData.name = updatedUser.name
    }
    if (updatedUser.phone) {
      personData.phone = updatedUser.phone
    }
    if (updatedUser.avatar !== undefined) {
      personData.avatar = updatedUser.avatar
    }

    if (!existingSelfPerson) {
      // Create new self-person
      await prisma.person.create({
        data: {
          ...personData,
          userId: sessionUser.id,
        }
      })
    } else {
      // Keep existing person's name, phone, email and status in sync
      await prisma.person.update({
        where: { id: existingSelfPerson.id },
        data: personData,
      })
    }

    return NextResponse.json({ success: true, user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, role: updatedUser.role, phone: updatedUser.phone, avatar: updatedUser.avatar } })
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil: ' + error.message }, { status: 500 })
  }
}
