import { CategoryRule } from '../entities/CategoryRule';

export interface CategoryRuleRepository {
  findByUserId(userId: string): Promise<CategoryRule[]>;
  findByKeywordAndUser(keyword: string, userId: string): Promise<CategoryRule | null>;
  findById(id: string): Promise<CategoryRule | null>;
  create(keyword: string, category: string, userId: string): Promise<CategoryRule>;
  delete(id: string): Promise<void>;
  findAll(): Promise<CategoryRule[]>;
}
