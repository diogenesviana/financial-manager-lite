import { ParsedTransaction } from '@/core/domain/ports/AiParser'
import { AbstractRegexParser } from './AbstractRegexParser'

export class MercadoPagoParser extends AbstractRegexParser {
  canParse(text: string): boolean {
    const lower = text.toLowerCase()
    return lower.includes('mercado pago') || lower.includes('mercadopago')
  }

  getBankName(): string {
    return 'Mercado Pago'
  }

  protected isLineValid(hasDate: boolean, hasAmount: boolean): boolean {
    // Requer data e valor na mesma linha para ser considerado uma transação válida
    return hasDate && hasAmount
  }

  override parse(text: string, referenceMonth: string): ParsedTransaction[] {
    // Filtra linhas do texto original que contenham resumos ou metadados da fatura
    // para evitar que o extrator de regex tire transações falsas (ex: "Consumos de 16/05 a 15/06" extraindo "a 15/06")
    const lines = text.split('\n')
    const filteredLines = lines.filter(line => {
      const lower = line.toLowerCase()
      const isNoise = 
        lower.includes('consumos de') || 
        lower.includes('resumo da fatura') || 
        lower.includes('total da fatura') ||
        lower.includes('a pagar') ||
        lower.includes('limite total') ||
        lower.includes('saque total') ||
        lower.includes('parcelamento de fatura') ||
        lower.includes('pagamento mínimo')
      return !isNoise
    })

    const cleanedText = filteredLines.join('\n')
    return super.parse(cleanedText, referenceMonth)
  }
}
