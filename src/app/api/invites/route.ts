import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeGetPendingInvites, makeHandleInvite } from '@/core/factories';

export const dynamic = 'force-dynamic';

// GET: Buscar convites pendentes para o usuário logado
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const getPendingInvites = makeGetPendingInvites();
    const invites = await getPendingInvites.execute(user.email, user.id);

    return NextResponse.json(invites);
  } catch (error: any) {
    console.error('Erro ao buscar convites:', error);
    return NextResponse.json({ error: 'Erro ao buscar convites: ' + error.message }, { status: 500 });
  }
}

// POST: Aceitar ou recusar convite
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { personId, action: rawAction } = body;
    const action = (rawAction || '').toUpperCase();

    if (!personId || !['ACCEPT', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const handleInvite = makeHandleInvite();
    const updatedPerson = await handleInvite.execute({
      personId,
      action: action as 'ACCEPT' | 'REJECT',
      userId: user.id,
      userEmail: user.email,
      userName: user.name
    });

    return NextResponse.json({ success: true, person: updatedPerson });
  } catch (error: any) {
    console.error('Erro ao processar convite:', error);
    const status = error.message.includes('não encontrado') ? 404 : 
                   error.message.includes('Não autorizado') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
