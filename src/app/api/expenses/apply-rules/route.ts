import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeSyncCategoryRules } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let dryRun = true;
    try {
      const body = await request.json();
      if (body && typeof body.dryRun === 'boolean') {
        dryRun = body.dryRun;
      }
    } catch (e) {
      // Fallback dryRun = true
    }

    const syncUseCase = makeSyncCategoryRules();
    // Força o targetUserId a ser estritamente o id do usuário logado
    const result = await syncUseCase.execute(user.id, dryRun);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao aplicar regras de categoria para o usuário:', error);
    return NextResponse.json({ error: 'Erro ao aplicar regras de categoria: ' + error.message }, { status: 500 });
  }
}
