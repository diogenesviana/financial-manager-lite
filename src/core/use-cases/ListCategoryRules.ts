import { CategoryRuleRepository } from '../domain/ports/CategoryRuleRepository';
import { CategoryRule } from '../domain/entities/CategoryRule';

export class ListCategoryRules {
  constructor(private ruleRepo: CategoryRuleRepository) {}

  async execute(userId: string): Promise<CategoryRule[]> {
    return this.ruleRepo.findByUserId(userId);
  }
}
