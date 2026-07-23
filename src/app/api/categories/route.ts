import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeListCategories } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const listCategories = makeListCategories();
    const categories = await listCategories.execute();

    return NextResponse.json(categories.map(c => c.name));
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}
