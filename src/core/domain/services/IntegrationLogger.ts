import { PrismaIntegrationLogRepository } from '@/adapters/db/PrismaIntegrationLogRepository';

const integrationRepo = new PrismaIntegrationLogRepository();

export class IntegrationLogger {
  /**
   * Executa uma função de integração externa, calcula seu tempo de execução,
   * captura sucessos/falhas e salva as informações correspondentes no banco de dados.
   */
  static async run<T>({
    serviceName,
    operation,
    userId,
    requestData
  }: {
    serviceName: string;
    operation: string;
    userId?: string | null;
    requestData?: any;
  }, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const durationMs = Math.round(performance.now() - startTime);

      // Persistir log de sucesso de forma segura para não travar a requisição principal
      try {
        await integrationRepo.save({
          serviceName,
          operation,
          status: 'SUCCESS',
          requestData,
          responseData: result,
          errorMessage: null,
          durationMs,
          userId
        });
      } catch (logError) {
        console.error(`[IntegrationLogger] Falha ao salvar log de sucesso para ${serviceName}.${operation}:`, logError);
      }

      return result;
    } catch (error: any) {
      const durationMs = Math.round(performance.now() - startTime);
      const errorMessage = error.message || String(error);

      // Persistir log de erro
      try {
        await integrationRepo.save({
          serviceName,
          operation,
          status: 'ERROR',
          requestData,
          responseData: null,
          errorMessage,
          durationMs,
          userId
        });
      } catch (logError) {
        console.error(`[IntegrationLogger] Falha ao salvar log de erro para ${serviceName}.${operation}:`, logError);
      }

      throw error;
    }
  }
}
