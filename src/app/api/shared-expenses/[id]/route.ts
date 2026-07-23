import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeHandleSharedExpense } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { action } = await request.json();
    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    const handleSharedExpense = makeHandleSharedExpense();
    const updated = await handleSharedExpense.execute(id, user.id, user.name, action);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar status do gasto compartilhado:', error);
    const status = error.message === 'Gasto não encontrado' ? 404 :
                   error.message === 'Não autorizado a alterar este gasto' ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status });
  }
}
