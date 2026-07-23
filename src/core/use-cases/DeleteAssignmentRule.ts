import { AssignmentRuleRepository } from '../domain/ports/AssignmentRuleRepository';

export class DeleteAssignmentRule {
  constructor(private ruleRepo: AssignmentRuleRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const rule = await this.ruleRepo.findById(id);
    if (!rule || rule.userId !== userId) {
      throw new Error('Regra não encontrada');
    }
    await this.ruleRepo.delete(id);
  }
}
