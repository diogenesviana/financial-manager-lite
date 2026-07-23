import { AssignmentRuleRepository } from '../domain/ports/AssignmentRuleRepository';
import { AssignmentRule } from '../domain/entities/AssignmentRule';

export class ListAssignmentRules {
  constructor(private ruleRepo: AssignmentRuleRepository) {}

  async execute(userId: string): Promise<AssignmentRule[]> {
    return this.ruleRepo.findByUser(userId);
  }
}
