import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeDeleteAssignmentRule } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const deleteAssignmentRule = makeDeleteAssignmentRule();
    await deleteAssignmentRule.execute(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE RULE ERROR:', error);
    const status = error.message === 'Regra não encontrada' ? 404 : 500;
    return NextResponse.json({ error: error.message || 'Erro ao excluir regra' }, { status });
  }
}
