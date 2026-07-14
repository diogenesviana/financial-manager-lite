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
      // 1. Tentar BrasilAPI primeiro (com User-Agent personalizado para evitar 403)
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
          headers: {
            'User-Agent': 'FinancialManagerLite/1.0 (contact: diogenesviana@github.com)'
          }
        });
        if (response.ok) {
          const data = await response.json();
          return {
            nome_fantasia: data.nome_fantasia || data.razao_social,
            razao_social: data.razao_social
          };
        }
        console.warn(`BrasilAPI retornou status ${response.status}. Tentando fallback...`);
      } catch (err) {
        console.warn(`Erro na BrasilAPI:`, err, `. Tentando fallback...`);
      }

      // 2. Fallback para ReceitaWS
      const fallbackResponse = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
        headers: {
          'User-Agent': 'FinancialManagerLite/1.0 (contact: diogenesviana@github.com)'
        }
      });
      if (!fallbackResponse.ok) {
        throw new Error(`Ambas APIs de CNPJ (BrasilAPI e ReceitaWS) falharam.`);
      }
      const fallbackData = await fallbackResponse.json();
      if (fallbackData.status === 'ERROR') {
        throw new Error(`ReceitaWS retornou erro: ${fallbackData.message}`);
      }
      return {
        nome_fantasia: fallbackData.fantasia || fallbackData.nome,
        razao_social: fallbackData.nome
      };
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
