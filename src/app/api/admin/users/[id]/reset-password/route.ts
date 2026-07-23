import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeResetUserPassword } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 });
    }

    const resetUserPassword = makeResetUserPassword();
    const newPassword = await resetUserPassword.execute(id);

    return NextResponse.json({ success: true, newPassword });
  } catch (error: any) {
    console.error('Erro ao regerar senha:', error);
    const status = error.message === 'Usuário não encontrado' ? 404 : 500;
    return NextResponse.json({ error: error.message || 'Erro ao regerar senha' }, { status });
  }
}
