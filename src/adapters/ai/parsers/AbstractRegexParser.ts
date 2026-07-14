import { ParsedTransaction } from '@/core/domain/ports/AiParser'
import { BankParserStrategy } from './BankParserStrategy'

export abstract class AbstractRegexParser implements BankParserStrategy {
  abstract canParse(text: string): boolean
  abstract getBankName(): string

  protected preprocessText(text: string): string {
    if (!text) return ''
    
    const lines = text.split('\n')
    const cleanedLines = lines
      .map(line => line.trim().replace(/\s+/g, ' '))
      .filter(line => {
        if (!line || line.length < 5) return false
        
        const lower = line.toLowerCase()
        const isBoilerplate = 
          lower.includes('sac ') ||
          lower.includes('ouvidoria') ||
          lower.includes('atendimento') ||
          lower.includes('central de relacionamento') ||
          lower.includes('ligações') ||
          lower.includes('deficiente') ||
          lower.includes('capitais e regiões') ||
          lower.includes('cnpj') ||
          lower.includes('endereço') ||
          lower.includes('inscrita no') ||
          lower.includes('telefone') ||
          lower.includes('central de vendas') ||
          lower.includes('www.') ||
          lower.includes('http') ||
          lower.includes('juros rotativos') ||
          lower.includes('multa por atraso') ||
          lower.includes('encargos de') ||
          lower.includes('custo efetivo total') ||
          lower.includes('cet a.a.') ||
          lower.includes('tabela de juros') ||
          lower.includes('dúvidas ligue') ||
          lower.includes('ouvidoria:') ||
          lower.includes('fale conosco') ||
          lower.includes('siga nas redes') ||
          lower.includes('para mais informações') ||
          lower.includes('consulte os termos')

        // Match date pattern: dd/mm, dd mmm, dd-mmm, dd/mm/yyyy (including dd de mmm)
        const hasDate = /\b\d{1,2}[\/\-\s]+(?:de\s+)?([jJ][aA][nN]|[fF][eE][vV]|[mM][aA][rR]|[aA][bB][rR]|[mM][aA][iI]|[jJ][uU][nN]|[jJ][uU][lL]|[aA][gG][oO]|[sS][eE][tT]|[oO][uU][tT]|[nN][oO][vV]|[dD][eE][zZ]|[aA][nN][oO]|[dD][iI][aA])\b|\b\d{1,2}\/\d{1,2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(line)

        const isAdditionalNoise =
          lower.includes('pagamento recebido') ||
          lower.includes('pagamento efetuado') ||
          lower.includes('pagamento de fatura') ||
          lower.includes('pagto fatura') ||
          lower.includes('pgto fatura') ||
          lower.includes('fatura anterior') ||
          lower.includes('crédito rotativo') ||
          // Ignore summary keywords only if the line does not contain a transaction date
          (!hasDate && (
            lower.includes('pagto') ||
            lower.includes('saldo') ||
            lower.includes('total') ||
            lower.includes('vencimento') ||
            lower.includes('limite') ||
            lower.includes('subtotal')
          )) ||
          lower.includes('encargos') ||
          lower.includes('juros') ||
          lower.includes('multa') ||
          lower.includes(' iof ') ||
          lower.includes('tributo')

        if (isBoilerplate || isAdditionalNoise) return false
        
        // Match numbers with comma/dot (monetary/price amount)
        const hasAmount = /\b\d+[\.,]\s*\d{2}\b/.test(line)

        return this.isLineValid(hasDate, hasAmount)
      })

    return cleanedLines.join('\n')
  }

  /**
   * Template method: Allows subclasses to specify their own line filtering logic based on presence of dates and amounts.
   */
  protected abstract isLineValid(hasDate: boolean, hasAmount: boolean): boolean

  /**
   * Template method: Allows subclasses to adjust the final parsed amount.
   * Useful for banks that invert the sign (like Inter).
   */
  protected adjustAmount(amount: number): number {
    return amount
  }

  public parse(text: string, referenceMonth: string): ParsedTransaction[] {
    const cleanedText = this.preprocessText(text)
    const lines = cleanedText.split('\n')
    const transactions: ParsedTransaction[] = []

    const [refYear, refMonthStr] = referenceMonth.split('-')
    const refMonth = parseInt(refMonthStr, 10)
    const refYearNum = parseInt(refYear, 10)

    const monthMap: { [key: string]: number } = {
      jan: 1, feb: 2, fev: 2, mar: 3, apr: 4, abr: 4, may: 5, mai: 5,
      jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, out: 10,
      nov: 11, dec: 12, dez: 12
    }

    // Matches DD/MM or DD-MM or DD/MM/YYYY or DD <month_name> or DD de <month_name> (with optional abbreviation dot and optional year) anywhere on the line. Requires a separator.
    const dateRegex = /\b(\d{1,2})(?:[\/\-\s]+(?:de\s+)?)([a-zA-Z]{3,4}|\d{1,2})\.?(?:[\/\-\s]+(?:de\s+)?\d{2,4})?\b/

    // Matches monetary value anywhere (e.g. 150,00 or -30,00 or R$ 12,50 or with Unicode minus sign \u2212 or plus sign +)
    const amountRegex = /([-\u2212\+]?\s*(?:R\$\s*)?[\d\.]+[\,]\s*\d{2})\b/

    console.log(`[Regex Debug] Iniciando análise de ${lines.length} linhas para o banco: ${this.getBankName()}`)

    for (const line of lines) {
      const cleanLine = line.trim()
      if (!cleanLine) continue

      const dateMatch = cleanLine.match(dateRegex)
      const amountMatch = cleanLine.match(amountRegex)

      console.log(`[Regex Line] "${cleanLine}" -> DateMatch: ${!!dateMatch} (${dateMatch?.[0]}), AmountMatch: ${!!amountMatch} (${amountMatch?.[0]})`)

      if (dateMatch && amountMatch) {
        const day = parseInt(dateMatch[1], 10)
        const monthPart = dateMatch[2].toLowerCase()
        
        let month = refMonth
        if (/^\d+$/.test(monthPart)) {
          month = parseInt(monthPart, 10)
        } else if (monthMap[monthPart]) {
          month = monthMap[monthPart]
        } else {
          continue
        }

        // Validate day and month ranges to prevent invalid dates (e.g., day 93)
        if (day < 1 || day > 31 || month < 1 || month > 12) {
          console.log(`[Regex Debug] Ignorando data fora dos limites válidos: ${day}/${month}`)
          continue
        }

        const dateIndex = cleanLine.indexOf(dateMatch[0])
        const amountIndex = cleanLine.lastIndexOf(amountMatch[0])
        
        let description = ''
        if (dateIndex < amountIndex) {
          description = cleanLine.substring(dateIndex + dateMatch[0].length, amountIndex).trim()
        } else {
          description = cleanLine.substring(amountIndex + amountMatch[0].length, dateIndex).trim()
        }

        // Clean up leading/trailing hyphens, bullets, slashes, Unicode minus, dots
        description = description.replace(/^\/?\d{2,4}\b/, '').trim()
        description = description.replace(/^[\s\-\u2212\*•\/\.]+|[\s\-\u2212\*•\/\.]+$/g, '').trim()

        // Remove card digits prefix or suffix if any (e.g. *1234 or 1234)
        description = description.replace(/^(?:[•\*\-\u2212\s]+)?\b\d{4}\b\s*/, '').trim()
        description = description.replace(/(?:[•\*\-\u2212\s]+)?\b\d{4}\b\s*$/, '').trim()
        description = description.replace(/^[\s\-\u2212\*•\/\.]+|[\s\-\u2212\*•\/\.]+$/g, '').trim()

        // Trata o valor monetário
        let amountStr = amountMatch[1]
          .replace(/[\u2212]/g, '-') // converte menos unicode em menos padrão
          .replace(/R\$/gi, '')
          .replace(/\s/g, '')
          .replace(/\./g, '') // remove separador de milhar
          .replace(',', '.') // converte vírgula decimal em ponto
          .trim()

        let amount = parseFloat(amountStr)

        const descLower = description.toLowerCase()
        const isFaturaPayment = 
          (descLower.includes('pagamento') && !descLower.includes('on line') && !descLower.includes('online') && !descLower.includes('débito') && !descLower.includes('debito')) ||
          descLower.includes('recebido') ||
          descLower.includes('pagto') ||
          descLower.includes('pgto')

        if (isFaturaPayment) {
          console.log(`[Regex Debug] Ignorando pagamento de fatura: ${description}`)
          continue
        }

        if (!isNaN(amount) && description.length > 0) {
          let year = refYearNum
          if (month === 12 && refMonth === 1) {
            year = refYearNum - 1
          } else if (month === 1 && refMonth === 12) {
            year = refYearNum + 1
          }

          const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

          if (isNaN(Date.parse(formattedDate))) {
            console.log(`[Regex Debug] Ignorando data inválida: ${formattedDate}`)
            continue
          }

          // Ajuste de valor via subclass (Strategy)
          amount = this.adjustAmount(amount)

          transactions.push({
            date: formattedDate,
            description: description,
            amount: amount,
            card: this.getBankName(),
            category: 'Outros'
          })
          console.log(`[Regex Match Success] Adicionado: ${formattedDate} | ${description} | ${amount} | ${this.getBankName()}`)
        }
      }
    }
    return transactions
  }
}
