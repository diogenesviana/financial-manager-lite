import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { PrismaUserRepository } from '@/adapters/db/PrismaUserRepository'
import { BcryptHasher } from '@/adapters/auth/BcryptHasher'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { newPassword } = await request.json()

    if (!newPassword || !passwordRegex.test(newPassword)) {
      return NextResponse.json({ 
        error: 'A senha deve ter no mínimo 8 caracteres, contendo pelo menos 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.' 
      }, { status: 400 })
    }

    const passwordHasher = new BcryptHasher()
    const passwordHash = await passwordHasher.hash(newPassword)

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { 
        password: passwordHash,
        forcePasswordReset: false
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao alterar senha' }, { status: 500 })
  }
}
