import { CategoryRuleRepository } from '../domain/ports/CategoryRuleRepository';
import { CategoryRule } from '../domain/entities/CategoryRule';

export class CreateCategoryRule {
  constructor(private ruleRepo: CategoryRuleRepository) {}

  async execute(data: { keyword: string; category: string; userId: string }): Promise<CategoryRule> {
    const { keyword, category, userId } = data;
    if (!keyword || !category) {
      throw new Error('Palavra-chave e categoria são obrigatórios');
    }

    const cleanKeyword = keyword.toLowerCase().trim();
    const existing = await this.ruleRepo.findByKeywordAndUser(cleanKeyword, userId);
    if (existing) {
      throw new Error('Essa palavra-chave já está cadastrada para uma categoria');
    }

    return this.ruleRepo.create(cleanKeyword, category, userId);
  }
}
