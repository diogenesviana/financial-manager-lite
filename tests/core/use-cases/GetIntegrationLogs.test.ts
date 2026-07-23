import { GetIntegrationLogs } from '../../../src/core/use-cases/GetIntegrationLogs';
import { IntegrationLogRepository } from '../../../src/core/domain/ports/IntegrationLogRepository';
import { IntegrationLog } from '../../../src/core/domain/entities/IntegrationLog';

class MockIntegrationLogRepository implements IntegrationLogRepository {
  public async findRecent(limit: number): Promise<IntegrationLog[]> {
    const logs: IntegrationLog[] = [
      {
        id: '1',
        serviceName: 'Gemini',
        operation: 'parseInvoiceText',
        status: 'SUCCESS',
        requestData: { textLength: 1000 },
        responseData: { referenceMonth: '2026-05', transactions: [] },
        errorMessage: null,
        durationMs: 1200,
        userId: 'user-1',
        createdAt: new Date(),
        user: { name: 'Admin User', email: 'admin@test.com' }
      }
    ];
    return logs.slice(0, limit);
  }

  public async save(log: Omit<IntegrationLog, 'id' | 'createdAt'>): Promise<IntegrationLog> {
    return {
      id: 'generated-id',
      createdAt: new Date(),
      ...log
    };
  }
}

describe('GetIntegrationLogs Use Case', () => {
  let getIntegrationLogs: GetIntegrationLogs;
  let mockRepo: MockIntegrationLogRepository;

  beforeEach(() => {
    mockRepo = new MockIntegrationLogRepository();
    getIntegrationLogs = new GetIntegrationLogs(mockRepo);
  });

  it('should return recent integration logs', async () => {
    const logs = await getIntegrationLogs.execute(10);
    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe('SUCCESS');
    expect(logs[0].serviceName).toBe('Gemini');
    expect(logs[0].operation).toBe('parseInvoiceText');
  });

  it('should throw error if limit is less than or equal to zero', async () => {
    await expect(getIntegrationLogs.execute(0)).rejects.toThrow('Limit must be greater than zero.');
    await expect(getIntegrationLogs.execute(-5)).rejects.toThrow('Limit must be greater than zero.');
  });
});
