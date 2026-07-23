import { CategoryRepository } from '../domain/ports/CategoryRepository';
import { SystemCategory } from '../domain/entities/SystemCategory';

const DEFAULT_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Moradia',
  'Casa',
  'Assinaturas',
  'Educação',
  'Vestuário',
  'Viagem',
  'Outros'
];

export class ListCategories {
  constructor(private categoryRepo: CategoryRepository) {}

  async execute(): Promise<SystemCategory[]> {
    let categories = await this.categoryRepo.findAll();
    if (categories.length === 0) {
      for (const name of DEFAULT_CATEGORIES) {
        try {
          await this.categoryRepo.create(name);
        } catch (e) {
          // Ignore duplication errors during seeding
        }
      }
      categories = await this.categoryRepo.findAll();
    }
    return categories;
  }
}
