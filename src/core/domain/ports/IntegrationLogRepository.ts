import { IntegrationLog } from '../entities/IntegrationLog';

export interface IntegrationLogRepository {
  findRecent(limit: number): Promise<IntegrationLog[]>;
  save(log: Omit<IntegrationLog, 'id' | 'createdAt'>): Promise<IntegrationLog>;
}
