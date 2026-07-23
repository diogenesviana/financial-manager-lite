import { BankRepository } from '../domain/ports/BankRepository';
import { SystemBank } from '../domain/entities/SystemBank';

const DEFAULT_BANKS = [
  'Nubank',
  'Inter',
  'Itaú',
  'Bradesco',
  'Santander',
  'C6 Bank',
  'Caixa',
  'Banco do Brasil',
  'Flash',
  'Sodexo',
  'Caju'
];

export class ListBanks {
  constructor(private bankRepo: BankRepository) {}

  async execute(): Promise<SystemBank[]> {
    let banks = await this.bankRepo.findAll();
    if (banks.length === 0) {
      for (const name of DEFAULT_BANKS) {
        try {
          await this.bankRepo.create(name);
        } catch (e) {
          // Ignore duplication errors during seeding
        }
      }
      banks = await this.bankRepo.findAll();
    }
    return banks;
  }
}
