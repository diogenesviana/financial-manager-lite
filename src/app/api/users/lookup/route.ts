import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeLookupUserForInvite } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'E-mail não informado' }, { status: 400 });
    }

    const lookupUserForInvite = makeLookupUserForInvite();
    const result = await lookupUserForInvite.execute(email, {
      id: currentUser.id,
      email: currentUser.email
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    const status = error.message === 'Não é possível convidar a si mesmo' ? 400 : 500;
    return NextResponse.json({ error: error.message || 'Erro ao buscar usuário' }, { status });
  }
}
