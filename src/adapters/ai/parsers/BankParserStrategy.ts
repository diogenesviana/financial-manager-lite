import { ParsedTransaction } from '@/core/domain/ports/AiParser'

export interface BankParserStrategy {
  /**
   * Verifica se o texto da fatura corresponde a este banco.
   * Geralmente procuramos por palavras-chave (ex: "nubank", "inter").
   */
  canParse(text: string): boolean

  /**
   * Retorna o nome legível do banco associado a esta estratégia.
   */
  getBankName(): string

  /**
   * Executa a extração local (regex) e retorna as transações identificadas.
   */
  parse(text: string, referenceMonth: string): ParsedTransaction[]
}
