import { BankRepository } from '../domain/ports/BankRepository';

export class DeleteBank {
  constructor(private bankRepo: BankRepository) {}

  async execute(id: string, userId?: string): Promise<void> {
    if (!id) {
      throw new Error('O ID do banco/cartão é obrigatório');
    }
    return this.bankRepo.delete(id, userId);
  }
}
