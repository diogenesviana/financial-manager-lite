import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { HandleInviteUseCase } from '@/core/use-cases/HandleInvite'
import { PrismaPersonRepository } from '@/adapters/db/PrismaPersonRepository'
import { PrismaUserRepository } from '@/adapters/db/PrismaUserRepository'

export const dynamic = 'force-dynamic'

const personRepository = new PrismaPersonRepository()
const userRepository = new PrismaUserRepository()
const handleInviteUseCase = new HandleInviteUseCase(personRepository, userRepository)

// GET: Buscar convites pendentes para o usuário logado
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const invites = await prisma.person.findMany({
      where: {
        OR: [
          { inviteEmail: user.email.toLowerCase(), linkStatus: 'PENDING' },
          { linkedUserId: user.id, linkStatus: 'PENDING' }
        ]
      },
      select: {
        id: true,
        name: true,
        inviteEmail: true,
        linkStatus: true,
        user: {
          select: {
            name: true,
            email: true,
            avatar: true,
          }
        }
      }
    })

    const mapped = invites.map((inv: any) => ({
      id: inv.id,
      name: inv.name,
      inviteEmail: inv.inviteEmail,
      linkStatus: inv.linkStatus,
      ownerName: inv.user?.name || 'Usuário',
      ownerEmail: inv.user?.email || '',
      ownerAvatar: inv.user?.avatar || null
    }))

    return NextResponse.json(mapped)
  } catch (error: any) {
    console.error('Erro ao buscar convites:', error)
    return NextResponse.json({ error: 'Erro ao buscar convites: ' + error.message }, { status: 500 })
  }
}

// POST: Aceitar ou recusar convite
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { personId, action: rawAction } = body
    const action = (rawAction || '').toUpperCase()

    if (!personId || !['ACCEPT', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const updatedPerson = await handleInviteUseCase.execute({
      personId,
      action: action as 'ACCEPT' | 'REJECT',
      userId: user.id,
      userEmail: user.email
    })

    return NextResponse.json({ success: true, person: updatedPerson })
  } catch (error: any) {
    console.error('Erro ao processar convite:', error)
    const status = error.message.includes('não encontrado') ? 404 : 
                   error.message.includes('Não autorizado') ? 403 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
}
