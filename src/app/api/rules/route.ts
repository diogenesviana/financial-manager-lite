import { NextResponse } from 'next/server';
import { makeListAssignmentRules, makeCreateAssignmentRule } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id')!;

    const listAssignmentRules = makeListAssignmentRules();
    const rules = await listAssignmentRules.execute(userId);
    return NextResponse.json(rules);
  } catch (error: any) {
    console.error('GET RULES ERROR:', error);
    return NextResponse.json({ error: 'Erro ao buscar regras' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id')!;

    const body = await request.json();
    const { keyword, personId } = body;

    const createAssignmentRule = makeCreateAssignmentRule();
    const rule = await createAssignmentRule.execute({ keyword, personId, userId });
    return NextResponse.json(rule);
  } catch (error: any) {
    console.error('POST RULE ERROR:', error);
    const status = error.message === 'Essa palavra-chave já está cadastrada' ? 409 : (error.message === 'Palavra-chave e pessoa são obrigatórios' ? 400 : 500);
    return NextResponse.json({ error: error.message || 'Erro ao criar regra' }, { status });
  }
}
