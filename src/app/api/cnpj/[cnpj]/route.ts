import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeLookupCnpj } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { cnpj } = await params;
    const lookupCnpj = makeLookupCnpj();
    const cnpjData = await lookupCnpj.execute(cnpj, user.id);

    return NextResponse.json(cnpjData);
  } catch (error: any) {
    console.error(`[CNPJ Proxy Error] Falha ao consultar CNPJ:`, error.message || error);
    const status = error.message === 'CNPJ inválido' ? 400 : 502;
    return NextResponse.json(
      { error: error.message || 'Erro ao consultar CNPJ' },
      { status }
    );
  }
}
