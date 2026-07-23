import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeChangePassword } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { newPassword } = await request.json();

    const changePassword = makeChangePassword();
    await changePassword.execute(currentUser.id, newPassword);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message.includes('A senha deve ter') ? 400 : 500;
    return NextResponse.json({ error: error.message || 'Erro ao alterar senha' }, { status });
  }
}
