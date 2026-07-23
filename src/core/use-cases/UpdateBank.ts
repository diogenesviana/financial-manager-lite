import { BankRepository } from '../domain/ports/BankRepository';
import { SystemBank } from '../domain/entities/SystemBank';

export class UpdateBank {
  constructor(private bankRepo: BankRepository) {}

  async execute(id: string, name: string, userId?: string): Promise<SystemBank> {
    if (!id) {
      throw new Error('O ID do banco/cartão é obrigatório');
    }
    if (!name || name.trim() === '') {
      throw new Error('O nome do banco/cartão é obrigatório');
    }

    const trimmedName = name.trim();
    const existing = await this.bankRepo.findByName(trimmedName);
    if (existing && existing.id !== id) {
      throw new Error('Este banco/cartão já existe');
    }

    return this.bankRepo.update(id, trimmedName, userId);
  }
}
