import { ParsedTransaction } from '@/core/domain/ports/AiParser'
import { AbstractRegexParser } from './AbstractRegexParser'

export class ItauParser extends AbstractRegexParser {
  canParse(text: string): boolean {
    const lower = text.toLowerCase()
    return (
      lower.includes('itaú') || 
      lower.includes('itau') || 
      lower.includes('lançamentos: compras e saques') ||
      lower.includes('lançamentos no cartão')
    )
  }

  getBankName(): string {
    return 'Itaú'
  }

  protected isLineValid(hasDate: boolean, hasAmount: boolean): boolean {
    // Para o Itaú, exigimos que a linha possua tanto a data quanto o valor
    return hasDate && hasAmount
  }

  override parse(text: string, referenceMonth: string): ParsedTransaction[] {
    // Localizar a seção de parcelas futuras e descartar tudo a partir dela
    let currentInvoiceText = text
    const index = text.toLowerCase().indexOf('compras parceladas - próximas faturas')
    if (index !== -1) {
      currentInvoiceText = text.substring(0, index)
    } else {
      const indexFallback = text.toLowerCase().indexOf('compras parceladas')
      if (indexFallback !== -1) {
        currentInvoiceText = text.substring(0, indexFallback)
      }
    }

    // Filtrar linhas do texto original que contenham ruídos específicos da fatura do Itaú
    const lines = currentInvoiceText.split('\n')
    const filteredLines = lines.filter(line => {
      const lower = line.toLowerCase()
      const isNoise = 
        lower.includes('resumo da fatura') || 
        lower.includes('total da fatura') ||
        lower.includes('a pagar') ||
        lower.includes('limite total') ||
        lower.includes('saque total') ||
        lower.includes('parcelamento de fatura') ||
        lower.includes('pagamento mínimo') ||
        lower.includes('lançamentos no cartão') ||
        lower.includes('total dos lançamentos')
      return !isNoise
    })

    const cleanedText = filteredLines.join('\n')
    return super.parse(cleanedText, referenceMonth)
  }
}
