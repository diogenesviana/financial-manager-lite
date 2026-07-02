import { IntegrationLogger } from '../../../src/core/domain/services/IntegrationLogger';
import { PrismaIntegrationLogRepository } from '@/adapters/db/PrismaIntegrationLogRepository';

describe('IntegrationLogger', () => {
  let spySave: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Espiona o método save do protótipo da classe real para evitar chamadas reais ao banco
    spySave = jest.spyOn(PrismaIntegrationLogRepository.prototype, 'save')
      .mockResolvedValue({
        id: 'test-log-id',
        serviceName: 'TestService',
        operation: 'testOp',
        status: 'SUCCESS',
        durationMs: 100,
        createdAt: new Date(),
        userId: 'user-1'
      });
  });

  afterEach(() => {
    spySave.mockRestore();
  });

  it('deve executar a função envelopada e registrar log de sucesso', async () => {
    const fn = jest.fn().mockResolvedValue('resultado-sucesso');
    
    const res = await IntegrationLogger.run({
      serviceName: 'TestService',
      operation: 'testOp',
      userId: 'user-1',
      requestData: { input: 'teste' }
    }, fn);

    expect(res).toBe('resultado-sucesso');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(spySave).toHaveBeenCalledTimes(1);
    expect(spySave).toHaveBeenCalledWith(expect.objectContaining({
      serviceName: 'TestService',
      operation: 'testOp',
      status: 'SUCCESS',
      userId: 'user-1',
      requestData: { input: 'teste' },
      responseData: 'resultado-sucesso'
    }));
  });

  it('deve registrar log de erro e relançar o erro caso a função falhe', async () => {
    const error = new Error('Falha simulada');
    const fn = jest.fn().mockRejectedValue(error);

    await expect(IntegrationLogger.run({
      serviceName: 'TestService',
      operation: 'testOp',
      userId: 'user-1',
      requestData: { input: 'teste' }
    }, fn)).rejects.toThrow('Falha simulada');

    expect(fn).toHaveBeenCalledTimes(1);
    expect(spySave).toHaveBeenCalledTimes(1);
    expect(spySave).toHaveBeenCalledWith(expect.objectContaining({
      serviceName: 'TestService',
      operation: 'testOp',
      status: 'ERROR',
      userId: 'user-1',
      requestData: { input: 'teste' },
      errorMessage: 'Falha simulada'
    }));
  });
});
