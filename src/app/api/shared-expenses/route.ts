import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeGetSharedExpenses } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const getSharedExpenses = makeGetSharedExpenses();
    const grouped = await getSharedExpenses.execute(user.id);

    return NextResponse.json(grouped);
  } catch (error: any) {
    console.error('Erro ao buscar despesas compartilhadas:', error);
    return NextResponse.json({ error: 'Erro ao buscar despesas compartilhadas: ' + error.message }, { status: 500 });
  }
}
