import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { IntegrationLogger } from '@/core/domain/services/IntegrationLogger';

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
    if (!cnpj || cnpj.trim().length === 0) {
      return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
    }

    const cleanCnpj = cnpj.replace(/\D/g, '');

    // Executa a chamada externa envelopada pelo IntegrationLogger
    const cnpjData = await IntegrationLogger.run({
      serviceName: 'BrasilAPI',
      operation: 'fetchCnpj',
      userId: user.id,
      requestData: { cnpj: cleanCnpj }
    }, async () => {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (!response.ok) {
        throw new Error(`BrasilAPI retornou status ${response.status}`);
      }
      return await response.json();
    });

    return NextResponse.json(cnpjData);
  } catch (error: any) {
    console.error(`[CNPJ Proxy Error] Falha ao consultar CNPJ:`, error.message || error);
    return NextResponse.json(
      { error: error.message || 'Erro ao consultar CNPJ' },
      { status: 502 }
    );
  }
}
