import { NextResponse } from 'next/server';
import { makeSearchExpenses } from '@/core/factories';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));
    const search = searchParams.get('search') || '';
    const month = searchParams.get('month') || 'all';
    const personId = searchParams.get('personId') || 'all';
    const category = searchParams.get('category') || 'all';
    const isPaid = searchParams.get('isPaid') || 'all';
    const source = searchParams.get('source') || 'all';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortDir = searchParams.get('sortDir') || 'desc';

    const searchExpensesUseCase = makeSearchExpenses();
    const { expenses, total, totalAmount } = await searchExpensesUseCase.execute(user.id, {
      page,
      limit,
      search,
      month,
      personId,
      category,
      isPaid,
      source,
      sortBy,
      sortDir
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      expenses,
      totalAmount,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error: any) {
    console.error('GET EXPENSES SEARCH ERROR:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar despesas', details: error.message },
      { status: 500 }
    );
  }
}
