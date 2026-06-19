import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { PrismaAuditLogRepository } from '@/adapters/db/PrismaAuditLogRepository'
import { GetAuditLogs } from '@/core/domain/use-cases/GetAuditLogs'

export const dynamic = 'force-dynamic'

const auditRepo = new PrismaAuditLogRepository()
const getAuditLogs = new GetAuditLogs(auditRepo)

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const logs = await getAuditLogs.execute(200)
    return NextResponse.json(logs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
