import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeGetIntegrationLogs } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const getIntegrationLogs = makeGetIntegrationLogs();
    const logs = await getIntegrationLogs.execute(200);
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error(`[Admin Integration Logs Error]`, error.message || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
