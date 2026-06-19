import { GetAuditLogs } from '../../../src/core/domain/use-cases/GetAuditLogs';
import { AuditLogRepository } from '../../../src/core/domain/ports/AuditLogRepository';
import { AuditLog } from '../../../src/core/domain/entities/AuditLog';

class MockAuditLogRepository implements AuditLogRepository {
  public async findRecent(limit: number): Promise<AuditLog[]> {
    const logs: AuditLog[] = [
      {
        id: '1',
        modelName: 'Expense',
        action: 'UPDATE',
        recordId: '123',
        createdAt: new Date(),
        user: { name: 'Admin', email: 'admin@admin.com' }
      }
    ];
    return logs.slice(0, limit);
  }
}

describe('GetAuditLogs Use Case', () => {
  let getAuditLogs: GetAuditLogs;
  let mockRepo: MockAuditLogRepository;

  beforeEach(() => {
    mockRepo = new MockAuditLogRepository();
    getAuditLogs = new GetAuditLogs(mockRepo);
  });

  it('should return recent audit logs', async () => {
    const logs = await getAuditLogs.execute(10);
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('UPDATE');
    expect(logs[0].modelName).toBe('Expense');
  });

  it('should throw error if limit is less than or equal to zero', async () => {
    await expect(getAuditLogs.execute(0)).rejects.toThrow('Limit must be greater than zero.');
    await expect(getAuditLogs.execute(-5)).rejects.toThrow('Limit must be greater than zero.');
  });
});
