import { CategoryRepository } from '../domain/ports/CategoryRepository';
import { SystemCategory } from '../domain/entities/SystemCategory';

export class UpdateCategory {
  constructor(private categoryRepo: CategoryRepository) {}

  async execute(id: string, name: string, userId?: string): Promise<SystemCategory> {
    if (!id) {
      throw new Error('O ID da categoria é obrigatório');
    }
    if (!name || name.trim() === '') {
      throw new Error('O nome da categoria é obrigatório');
    }

    const trimmedName = name.trim();
    const existing = await this.categoryRepo.findByName(trimmedName);
    if (existing && existing.id !== id) {
      throw new Error('Esta categoria já existe');
    }

    return this.categoryRepo.update(id, trimmedName, userId);
  }
}
