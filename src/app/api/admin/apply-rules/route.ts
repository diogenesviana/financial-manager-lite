import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { SyncCategoryRules } from '@/core/use-cases/SyncCategoryRules'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas admins podem rodar o update em lote ou filtrar por outros usuários
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Ação permitida apenas para administradores' }, { status: 403 })
    }

    let dryRun = true
    let targetUserId = ''
    try {
      const body = await request.json()
      if (body) {
        if (typeof body.dryRun === 'boolean') {
          dryRun = body.dryRun
        }
        if (typeof body.targetUserId === 'string') {
          targetUserId = body.targetUserId
        }
      }
    } catch (e) {
      // Se não houver body válido, assume dryRun = true
    }

    const syncUseCase = new SyncCategoryRules()
    const result = await syncUseCase.execute(targetUserId, dryRun)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Erro ao aplicar regras de categoria (Admin):', error)
    return NextResponse.json({ error: 'Erro ao aplicar regras de categoria: ' + error.message }, { status: 500 })
  }
}
