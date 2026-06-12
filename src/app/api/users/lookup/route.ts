import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/users/lookup?email=xxx
// Returns public profile of a user by email (for invite preview)
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = (searchParams.get('email') || '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'E-mail não informado' }, { status: 400 })
    }

    // Don't allow looking up yourself
    if (email === currentUser.email.toLowerCase()) {
      return NextResponse.json({ error: 'Não é possível convidar a si mesmo' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        avatar: true,
        email: true,
      }
    })

    if (!user) {
      return NextResponse.json({ found: false }, { status: 200 })
    }

    // Check if this person is already linked/invited by the current user
    const existingPerson = await prisma.person.findFirst({
      where: {
        userId: currentUser.id,
        linkedUserId: user.id,
        linkStatus: { not: 'REJECTED' }
      }
    })

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        email: user.email,
      },
      alreadyLinked: !!existingPerson,
    })
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 })
  }
}
