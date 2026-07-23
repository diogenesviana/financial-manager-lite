import { CnpjService } from '@/core/domain/ports/CnpjService';
import { IntegrationLogger } from '@/core/domain/services/IntegrationLogger';

export class CnpjApiAdapter implements CnpjService {
  async lookup(cnpj: string, userId?: string): Promise<{ nome_fantasia: string; razao_social: string }> {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (!cleanCnpj || cleanCnpj.length !== 14) {
      throw new Error('CNPJ inválido');
    }

    return IntegrationLogger.run({
      serviceName: 'BrasilAPI',
      operation: 'fetchCnpj',
      userId,
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
  }
}
