import { AbstractRegexParser } from './AbstractRegexParser'

export class NubankParser extends AbstractRegexParser {
  canParse(text: string): boolean {
    return text.toLowerCase().includes('nubank')
  }

  getBankName(): string {
    return 'Nubank'
  }

  protected isLineValid(hasDate: boolean, hasAmount: boolean): boolean {
    // Nubank requires both date AND amount on the same line to consider it a valid transaction line
    return hasDate && hasAmount
  }
}
