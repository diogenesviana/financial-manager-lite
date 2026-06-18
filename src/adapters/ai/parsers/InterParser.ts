import { AbstractRegexParser } from './AbstractRegexParser'

export class InterParser extends AbstractRegexParser {
  canParse(text: string): boolean {
    return text.toLowerCase().includes('inter')
  }

  getBankName(): string {
    return 'Inter'
  }

  protected isLineValid(hasDate: boolean, hasAmount: boolean): boolean {
    // For Inter, lines containing either date OR amount are kept 
    // to allow AI to parse multi-line splits if fallback is needed.
    // However, for the regex to match, it inherently requires both to be found by the regex matcher later.
    return hasDate || hasAmount
  }

  protected adjustAmount(amount: number): number {
    // Para o Banco Inter, os sinais no PDF são invertidos: 
    // compras vêm com "-" (ou como hífen de separador) e créditos/estornos com "+" (ou sem sinal).
    // Precisamos inverter para o padrão do nosso sistema (compras positivas, créditos/estornos negativos).
    return -amount
  }
}
