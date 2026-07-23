import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeListBanks, makeCreateBank } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 });
    }

    const listBanks = makeListBanks();
    const banks = await listBanks.execute();
    return NextResponse.json(banks);
  } catch (error: any) {
    console.error('Erro ao listar bancos (admin):', error);
    return NextResponse.json({ error: 'Erro ao listar bancos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 });
    }

    const { name } = await request.json();
    const createBank = makeCreateBank();
    const newBank = await createBank.execute(name, currentUser.id);

    return NextResponse.json(newBank, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar banco/cartão:', error);
    const status = error.message === 'Este banco/cartão já existe' || error.message === 'O nome do banco/cartão é obrigatório' ? 400 : 500;
    return NextResponse.json({ error: error.message || 'Erro ao criar banco/cartão' }, { status });
  }
}
