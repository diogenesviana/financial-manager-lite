import { NextResponse } from 'next/server';
import { makeListExpenses, makeCreateExpense } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id')!;

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().substring(0, 7);
    const personId = searchParams.get('personId');

    const listExpenses = makeListExpenses();
    const expenses = await listExpenses.execute(userId, month, personId);

    return NextResponse.json(expenses);
  } catch (error: any) {
    console.error('GET EXPENSES ERROR:', error);
    return NextResponse.json({ error: 'Erro ao buscar despesas', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id')!;
    const body = await request.json();

    const createExpense = makeCreateExpense();
    const expense = await createExpense.execute({
      userId,
      description: body.description,
      amount: parseFloat(body.amount),
      date: body.date,
      month: body.month,
      personId: body.personId,
      card: body.card,
      category: body.category
    });

    return NextResponse.json(expense);
  } catch (error: any) {
    console.error('POST EXPENSE ERROR:', error);
    const status = error.message === 'Esta despesa já está cadastrada com os mesmos detalhes.' ? 409 : 500;
    return NextResponse.json({ error: error.message || 'Erro ao criar despesa' }, { status });
  }
}
