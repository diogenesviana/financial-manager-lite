import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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
            email: true
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
      ownerEmail: inv.user?.email || ''
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

    // Buscar a pessoa
    const person = await prisma.person.findUnique({
      where: { id: personId }
    })

    if (!person) {
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 })
    }

    // Verificar se o convite realmente é para este usuário
    const isTargetUser = 
      person.linkedUserId === user.id || 
      (person.inviteEmail && person.inviteEmail.toLowerCase() === user.email.toLowerCase())

    if (!isTargetUser || person.linkStatus !== 'PENDING') {
      return NextResponse.json({ error: 'Convite não autorizado ou já processado' }, { status: 403 })
    }

    // Atualizar status
    const linkStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED'
    const updatedPerson = await prisma.person.update({
      where: { id: personId },
      data: {
        linkStatus,
        linkedUserId: user.id // Atualiza o ID caso tenha sido convidado por e-mail
      }
    })

    return NextResponse.json({ success: true, person: updatedPerson })
  } catch (error: any) {
    console.error('Erro ao processar convite:', error)
    return NextResponse.json({ error: 'Erro ao processar convite: ' + error.message }, { status: 500 })
  }
}
