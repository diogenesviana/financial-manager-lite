import { AbstractRegexParser } from './AbstractRegexParser'

export class ItauParser extends AbstractRegexParser {
  canParse(text: string): boolean {
    const lower = text.toLowerCase()
    return lower.includes('itaú') || lower.includes('itau')
  }

  getBankName(): string {
    return 'Itaú'
  }

  protected isLineValid(hasDate: boolean, hasAmount: boolean): boolean {
    // Para o Itaú, exigimos que a linha possua tanto a data quanto o valor
    return hasDate && hasAmount
  }
}
