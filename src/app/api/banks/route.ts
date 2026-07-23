import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeListBanks } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const listBanks = makeListBanks();
    const banks = await listBanks.execute();

    return NextResponse.json(banks.map(b => b.name));
  } catch (error) {
    console.error('Erro ao buscar bancos:', error);
    return NextResponse.json({ error: 'Erro ao buscar bancos' }, { status: 500 });
  }
}
