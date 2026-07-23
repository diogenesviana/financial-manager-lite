import { AssignmentRuleRepository } from '../domain/ports/AssignmentRuleRepository';
import { AssignmentRule } from '../domain/entities/AssignmentRule';

export class CreateAssignmentRule {
  constructor(private ruleRepo: AssignmentRuleRepository) {}

  async execute(data: { keyword: string; personId: string; userId: string }): Promise<AssignmentRule> {
    const { keyword, personId, userId } = data;
    if (!keyword || !personId) {
      throw new Error('Palavra-chave e pessoa são obrigatórios');
    }

    const cleanKeyword = keyword.toLowerCase().trim();
    const rules = await this.ruleRepo.findByUser(userId);
    const existingRule = rules.find(r => r.keyword === cleanKeyword);
    if (existingRule) {
      throw new Error('Essa palavra-chave já está cadastrada');
    }

    return this.ruleRepo.save({ keyword: cleanKeyword, personId, userId });
  }
}
