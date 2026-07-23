import { CnpjService } from '../domain/ports/CnpjService';

export class LookupCnpj {
  constructor(private cnpjService: CnpjService) {}

  async execute(cnpj: string, userId?: string): Promise<{ nome_fantasia: string; razao_social: string }> {
    if (!cnpj || cnpj.trim().length === 0) {
      throw new Error('CNPJ inválido');
    }
    return this.cnpjService.lookup(cnpj, userId);
  }
}
