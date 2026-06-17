export interface ParsedTransaction {
  date: string // YYYY-MM-DD
  description: string
  amount: number
  card: string | null
  category?: string | null
}

export interface AiParser {
  parseInvoiceText(text: string, referenceMonth: string): Promise<{ resolvedMonth: string; transactions: ParsedTransaction[] }>
}
