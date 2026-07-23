import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeGetAuditLogs } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const getAuditLogs = makeGetAuditLogs();
    const logs = await getAuditLogs.execute(200);
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
