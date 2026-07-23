import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeDeletePerson, makeUpdatePerson } from '@/core/factories';

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

    const deletePerson = makeDeletePerson();
    await deletePerson.execute(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir pessoa:', error);
    const status = error.message === 'Pessoa não encontrada' ? 404 : 
                   error.message === 'Você não pode excluir o seu próprio integrante.' ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const updatePerson = makeUpdatePerson();
    const updated = await updatePerson.execute({
      id,
      userId: user.id,
      userEmail: user.email,
      name: body.name,
      phone: body.phone,
      inviteEmail: body.inviteEmail,
      isSystemUser: body.isSystemUser,
      avatar: body.avatar
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Erro ao editar pessoa:', error);
    const status = error.message === 'Nome é obrigatório' || 
                   error.message === 'Uma pessoa com este nome já está cadastrada.' || 
                   error.message === 'Você não pode desvincular o seu próprio integrante do sistema.' || 
                   error.message === 'Você não pode alterar o e-mail de vínculo do seu próprio integrante.' || 
                   error.message === 'E-mail de convite é obrigatório para membros do sistema.' || 
                   error.message === 'Você não pode convidar a si mesmo.' ? 400 : 
                   error.message === 'Pessoa não encontrada' ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
