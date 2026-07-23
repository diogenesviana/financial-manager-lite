import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeListCategoryRules, makeCreateCategoryRule } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const listCategoryRules = makeListCategoryRules();
    const rules = await listCategoryRules.execute(user.id);
    return NextResponse.json(rules);
  } catch (error: any) {
    console.error('GET CATEGORY RULES ERROR:', error);
    return NextResponse.json({ error: 'Erro ao buscar regras de categoria' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, category } = body;

    const createCategoryRule = makeCreateCategoryRule();
    const rule = await createCategoryRule.execute({ keyword, category, userId: user.id });
    return NextResponse.json(rule);
  } catch (error: any) {
    console.error('POST CATEGORY RULE ERROR:', error);
    const status = error.message === 'Essa palavra-chave já está cadastrada para uma categoria' || error.message === 'Palavra-chave e categoria são obrigatórios' ? 409 : 500;
    return NextResponse.json({ error: error.message || 'Erro ao criar regra de categoria' }, { status });
  }
}
