import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeGetExpenseSuggestions } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const getExpenseSuggestions = makeGetExpenseSuggestions();
    const suggestions = await getExpenseSuggestions.execute(user.id);
    return NextResponse.json(suggestions);
  } catch (error: any) {
    console.error('GET EXPENSE SUGGESTIONS ERROR:', error);
    return NextResponse.json({ error: 'Erro ao buscar sugestões' }, { status: 500 });
  }
}
