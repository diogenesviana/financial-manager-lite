import { CategoryRepository } from '../domain/ports/CategoryRepository';
import { SystemCategory } from '../domain/entities/SystemCategory';

export class CreateCategory {
  constructor(private categoryRepo: CategoryRepository) {}

  async execute(name: string, userId?: string): Promise<SystemCategory> {
    if (!name || name.trim() === '') {
      throw new Error('O nome da categoria é obrigatório');
    }

    const trimmedName = name.trim();
    const existing = await this.categoryRepo.findByName(trimmedName);
    if (existing) {
      throw new Error('Esta categoria já existe');
    }

    return this.categoryRepo.create(trimmedName, userId);
  }
}
