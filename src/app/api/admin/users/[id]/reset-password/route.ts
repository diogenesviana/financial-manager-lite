import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { BcryptHasher } from '@/adapters/auth/BcryptHasher'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Apenas permite reset se ainda estiver forcePasswordReset ou for ação manual do Admin
    // Neste caso, a ação é sempre permitida para o admin (mas a UI só vai mostrar o botão se tiver pendente)
    
    // Generate new password
    const randomHex = crypto.randomBytes(4).toString('hex')
    const specialChars = ['@', '$', '!', '%', '*', '?', '&']
    const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)]
    const newPassword = `Temp${randomHex}${randomSpecial}1`
    
    // Hash new password
    const hasher = new BcryptHasher()
    const passwordHash = await hasher.hash(newPassword)
    
    // Update user
    await prisma.user.update({
      where: { id },
      data: {
        password: passwordHash,
        forcePasswordReset: true
      }
    })

    return NextResponse.json({ success: true, newPassword })
  } catch (error: any) {
    console.error('Erro ao regerar senha:', error)
    return NextResponse.json({ error: 'Erro ao regerar senha' }, { status: 500 })
  }
}
