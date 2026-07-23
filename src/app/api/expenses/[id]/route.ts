import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeDeleteExpense, makeUpdateExpense } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { personId, month, isPaid } = await request.json();
    const updateExpense = makeUpdateExpense();
    const updated = await updateExpense.executePatch(id, user.id, user.name, {
      personId,
      month,
      isPaid
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH ERROR:', error);
    return NextResponse.json({ error: 'Erro ao atualizar despesa', details: error.message }, { status: 500 });
  }
}

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

    const body = await request.json();
    const updateExpense = makeUpdateExpense();
    const updated = await updateExpense.executePut(id, user.id, {
      description: body.description,
      amount: body.amount,
      category: body.category,
      card: body.card,
      date: body.date,
      month: body.month
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT ERROR:', error);
    const status = error.message === 'Descrição é obrigatória para gastos manuais' || error.message === 'Valor inválido' || error.message === 'Data inválida' ? 400 : 500;
    return NextResponse.json({ error: error.message || 'Erro ao atualizar despesa' }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const deleteExpense = makeDeleteExpense();
    await deleteExpense.execute(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE ERROR:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir despesa' }, { status: 500 });
  }
}
