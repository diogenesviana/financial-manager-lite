import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeDeleteCategory } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 });
    }

    const deleteCategory = makeDeleteCategory();
    await deleteCategory.execute(id, currentUser.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir categoria' }, { status: 500 });
  }
}
