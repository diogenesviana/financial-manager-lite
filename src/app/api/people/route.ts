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
    const userId = request.headers.get('x-user-id')!

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, name: true, email: true, avatar: true }
    })

    if (dbUser) {
      // Garantir que existe o integrante referente a si mesmo (deduplicando se houver mais de um)
      // Delegado para o UseCase para evitar lógica de negócio no GET
      await syncSelfPersonUseCase.execute({
        userId,
        userName: dbUser.name,
        userPhone: dbUser.phone,
        userEmail: dbUser.email,
        userAvatar: dbUser.avatar
      })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    let monthlyTotals: Record<string, number> = {}
    let prevMonthlyTotals: Record<string, number> = {}

    if (month === 'last30') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const expensesSum = await prisma.expense.groupBy({
        by: ['personId'],
        where: {
          userId,
          date: { gte: thirtyDaysAgo },
          deletedAt: null
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
    } else if (month && month !== 'all') {
      const expensesSum = await prisma.expense.groupBy({
        by: ['personId'],
        where: {
          userId,
          month,
          deletedAt: null
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

      const [year, mVal] = month.split('-').map(Number)
      let prevYear = year
      let prevMonthVal = mVal - 1
      if (prevMonthVal === 0) {
        prevMonthVal = 12
        prevYear = year - 1
      }
      const prevMonth = `${prevYear}-${String(prevMonthVal).padStart(2, '0')}`

      const prevExpensesSum = await prisma.expense.groupBy({
        by: ['personId'],
        where: {
          userId,
          month: prevMonth,
          deletedAt: null
        },
        _sum: {
          amount: true
        }
      })
      prevExpensesSum.forEach(item => {
        if (item.personId) {
          prevMonthlyTotals[item.personId] = item._sum.amount || 0
        }
      })
    } else if (month === 'all') {
      const expensesSum = await prisma.expense.groupBy({
        by: ['personId'],
        where: {
          userId,
          deletedAt: null
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

    const people = await prisma.person.findMany({
      where: { userId },
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

    const mapped = people.map(p => {
      const total = monthlyTotals[p.id] || 0
      const prevTotal = prevMonthlyTotals[p.id] || 0
      const diff = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0

      return {
        id: p.id,
        name: p.name,
        userId: p.userId,
        phone: p.linkedUser?.phone || p.phone,
        avatar: p.linkedUser?.avatar || p.avatar,
        linkedUserId: p.linkedUserId,
        linkStatus: p.linkStatus,
        inviteEmail: p.inviteEmail,
        createdAt: p.createdAt,
        monthlyTotal: total,
        prevMonthlyTotal: prevTotal,
        diff
      }
    }).sort((a, b) => {
      const isSelfA = a.linkedUserId === userId ? 1 : 0
      const isSelfB = b.linkedUserId === userId ? 1 : 0
      return isSelfB - isSelfA
    })

    return NextResponse.json(mapped)
  } catch (error: any) {
    console.error('Erro ao buscar pessoas:', error)
    return NextResponse.json({ error: 'Erro ao buscar pessoas: ' + error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id')!
    const userEmail = request.headers.get('x-user-email')!

    const body = await request.json()
    
    const person = await createPersonUseCase.execute({
      userId,
      userEmail,
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
