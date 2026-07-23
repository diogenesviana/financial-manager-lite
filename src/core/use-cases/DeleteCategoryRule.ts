import { CategoryRuleRepository } from '../domain/ports/CategoryRuleRepository';

export class DeleteCategoryRule {
  constructor(private ruleRepo: CategoryRuleRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const rule = await this.ruleRepo.findById(id);
    if (!rule || rule.userId !== userId) {
      throw new Error('Regra de categoria não encontrada');
    }
    await this.ruleRepo.delete(id);
  }
}
