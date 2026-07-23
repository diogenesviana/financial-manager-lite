import { AuditLogRepository } from '../domain/ports/AuditLogRepository';
import { AuditLog } from '../domain/entities/AuditLog';

export class GetAuditLogs {
  constructor(private auditLogRepository: AuditLogRepository) {}

  async execute(limit: number = 100): Promise<AuditLog[]> {
    if (limit <= 0) {
      throw new Error('Limit must be greater than zero.');
    }
    return this.auditLogRepository.findRecent(limit);
  }
}
