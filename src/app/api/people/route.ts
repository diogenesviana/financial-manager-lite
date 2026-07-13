import { NextResponse } from 'next/server'
import { PrismaPersonRepository } from '@/adapters/db/PrismaPersonRepository'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { SyncSelfPersonUseCase } from '@/core/use-cases/SyncSelfPerson'
import { CreatePersonUseCase } from '@/core/use-cases/CreatePerson'

export const dynamic = 'force-dynamic'

const personRepository = new PrismaPersonRepository()
const syncSelfPersonUseCase = new SyncSelfPersonUseCase(personRepository)

const createPersonUseCase = new CreatePersonUseCase(
  personRepository,
  async (email) => {
    return prisma.user.findUnique({ where: { email }, select: { id: true } })
  }
)

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { phone: true, name: true, email: true }
    })

    if (dbUser) {
      // Garantir que existe o integrante referente a si mesmo (deduplicando se houver mais de um)
      // Delegado para o UseCase para evitar lógica de negócio no GET
      await syncSelfPersonUseCase.execute({
        userId: user.id,
        userName: dbUser.name,
        userPhone: dbUser.phone,
        userEmail: dbUser.email
      })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    let monthlyTotals: Record<string, number> = {}
    if (month) {
      const expensesSum = await prisma.expense.groupBy({
        by: ['personId'],
        where: {
          userId: user.id,
          month: month === 'all' ? undefined : month,
        },
        _sum: {
          amount: true
        }
      })
      expensesSum.forEach(item => {
        if (item.personId) {
          monthlyTotals[item.personId] = item._sum.amount || 0
        }
      })
    }

    // A listagem continua consultando o DB para fazer o join com 'linkedUser' (avatar)
    // Isso é aceitável na camada de apresentação/query
    const people = await prisma.person.findMany({
      where: { userId: user.id },
      include: {
        linkedUser: {
          select: {
            phone: true,
            avatar: true
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
      avatar: p.linkedUser?.avatar || p.avatar,
      linkedUserId: p.linkedUserId,
      linkStatus: p.linkStatus,
      inviteEmail: p.inviteEmail,
      createdAt: p.createdAt,
      monthlyTotal: monthlyTotals[p.id] || 0
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
    
    const person = await createPersonUseCase.execute({
      userId: user.id,
      userEmail: user.email,
      name: body.name,
      phone: body.phone,
      inviteEmail: body.inviteEmail,
      isSystemUser: body.isSystemUser
    })

    return NextResponse.json(person)
  } catch (error: any) {
    console.error('Erro ao criar pessoa:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
