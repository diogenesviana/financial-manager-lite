import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeClearUserData } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let type = 'all_expenses';
    try {
      const body = await request.json();
      if (body && body.type) {
        type = body.type;
      }
    } catch {
      // Default fallback
    }

    const clearUserData = makeClearUserData();
    await clearUserData.execute(user.id, type);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao limpar dados:', error);
    return NextResponse.json({ error: 'Erro ao limpar dados: ' + error.message }, { status: 500 });
  }
}
