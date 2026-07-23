import { BankRepository } from '../domain/ports/BankRepository';
import { SystemBank } from '../domain/entities/SystemBank';

export class CreateBank {
  constructor(private bankRepo: BankRepository) {}

  async execute(name: string, userId?: string): Promise<SystemBank> {
    if (!name || name.trim() === '') {
      throw new Error('O nome do banco/cartão é obrigatório');
    }

    const trimmedName = name.trim();
    const existing = await this.bankRepo.findByName(trimmedName);
    if (existing) {
      throw new Error('Este banco/cartão já existe');
    }

    return this.bankRepo.create(trimmedName, userId);
  }
}
