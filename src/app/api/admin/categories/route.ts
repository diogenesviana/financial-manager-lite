import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeListCategories, makeCreateCategory } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 });
    }

    const listCategories = makeListCategories();
    const categories = await listCategories.execute();
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Erro ao listar categorias (admin):', error);
    return NextResponse.json({ error: 'Erro ao listar categorias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 });
    }

    const { name } = await request.json();
    const createCategory = makeCreateCategory();
    const newCategory = await createCategory.execute(name, currentUser.id);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar categoria:', error);
    const status = error.message === 'Esta categoria já existe' || error.message === 'O nome da categoria é obrigatório' ? 400 : 500;
    return NextResponse.json({ error: error.message || 'Erro ao criar categoria' }, { status });
  }
}
