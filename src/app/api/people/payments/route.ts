import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeGetPaymentStatuses, makeUpdatePaymentStatus } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    if (!month) return NextResponse.json({ error: 'Mês é obrigatório' }, { status: 400 });

    const getPaymentStatuses = makeGetPaymentStatuses();
    const statuses = await getPaymentStatuses.execute(month, user.id);
    return NextResponse.json(statuses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { personId, month, isPaid } = await request.json();
    if (!personId || !month) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

    const updatePaymentStatus = makeUpdatePaymentStatus();
    const status = await updatePaymentStatus.execute({
      personId,
      month,
      isPaid,
      userId: user.id,
      userName: user.name
    });

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('POST PAYMENT STATUS ERROR:', error);
    const status = error.message === 'Pessoa não encontrada' ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
