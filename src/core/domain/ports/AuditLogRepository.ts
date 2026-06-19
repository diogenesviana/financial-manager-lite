import { AuditLog } from '../entities/AuditLog';

export interface AuditLogRepository {
  findRecent(limit: number): Promise<AuditLog[]>;
}
