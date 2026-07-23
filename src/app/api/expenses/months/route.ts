import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeGetExpenseMonths } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const getExpenseMonths = makeGetExpenseMonths();
    const months = await getExpenseMonths.execute(user.id);
    return NextResponse.json(months);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
