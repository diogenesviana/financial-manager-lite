import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeWipeSystem } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Ação permitida apenas para administradores' }, { status: 403 });
    }

    const wipeSystem = makeWipeSystem();
    await wipeSystem.execute(user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao limpar o sistema:', error);
    return NextResponse.json({ error: 'Erro ao limpar o sistema: ' + error.message }, { status: 500 });
  }
}
