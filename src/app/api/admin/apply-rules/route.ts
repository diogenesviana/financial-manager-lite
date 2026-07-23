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

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Ação permitida apenas para administradores' }, { status: 403 });
    }

    let dryRun = true;
    let targetUserId = '';
    try {
      const body = await request.json();
      if (body) {
        if (typeof body.dryRun === 'boolean') {
          dryRun = body.dryRun;
        }
        if (typeof body.targetUserId === 'string') {
          targetUserId = body.targetUserId;
        }
      }
    } catch (e) {
      // Default fallback
    }

    const syncUseCase = makeSyncCategoryRules();
    const result = await syncUseCase.execute(targetUserId, dryRun);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao aplicar regras de categoria (Admin):', error);
    return NextResponse.json({ error: 'Erro ao aplicar regras de categoria: ' + error.message }, { status: 500 });
  }
}
