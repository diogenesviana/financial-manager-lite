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

  protected preprocessText(text: string): string {
    if (!text) return ''

    // Localizar a seção de parcelas futuras e descartar tudo a partir dela
    const index = text.toLowerCase().indexOf('compras parceladas - próximas faturas')
    let currentInvoiceText = text
    if (index !== -1) {
      currentInvoiceText = text.substring(0, index)
    } else {
      // Tentar um termo mais genérico caso o hífen mude
      const indexFallback = text.toLowerCase().indexOf('compras parceladas')
      if (indexFallback !== -1) {
        currentInvoiceText = text.substring(0, indexFallback)
      }
    }

    return super.preprocessText(currentInvoiceText)
  }
}
