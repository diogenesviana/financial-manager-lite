import { IntegrationLogRepository } from '../ports/IntegrationLogRepository';
import { IntegrationLog } from '../entities/IntegrationLog';

export class GetIntegrationLogs {
  constructor(private integrationLogRepository: IntegrationLogRepository) {}

  async execute(limit: number = 100): Promise<IntegrationLog[]> {
    if (limit <= 0) {
      throw new Error('Limit must be greater than zero.');
    }
    return this.integrationLogRepository.findRecent(limit);
  }
}
