import { CategoryRepository } from '../domain/ports/CategoryRepository';

export class DeleteCategory {
  constructor(private categoryRepo: CategoryRepository) {}

  async execute(id: string, userId?: string): Promise<void> {
    if (!id) {
      throw new Error('O ID da categoria é obrigatório');
    }
    return this.categoryRepo.delete(id, userId);
  }
}
