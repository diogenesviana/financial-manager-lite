export interface CnpjService {
  lookup(cnpj: string, userId?: string): Promise<{ nome_fantasia: string; razao_social: string }>;
}
