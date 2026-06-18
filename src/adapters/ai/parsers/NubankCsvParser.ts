import { ParsedTransaction } from '@/core/domain/ports/AiParser'
import { BankParserStrategy } from './BankParserStrategy'

export class NubankCsvParser implements BankParserStrategy {
  canParse(text: string): boolean {
    if (!text) return false
    
    // Pegar a primeira linha válida para checar o cabeçalho
    const lines = text.trim().split('\n')
    if (lines.length === 0) return false

    const header = lines[0].toLowerCase()
    
    // Verifica se tem colunas esperadas de CSV do Nubank
    // Padrões conhecidos: "date,category,title,amount" ou "data,categoria,titulo,valor"
    const hasDataDate = header.includes('date') || header.includes('data')
    const hasAmount = header.includes('amount') || header.includes('valor')
    const hasTitle = header.includes('title') || header.includes('titulo') || header.includes('título')

    // Só é considerado CSV se tiver vírgulas dividindo as colunas
    const isCsvFormat = header.includes(',') || header.includes(';')

    return isCsvFormat && hasDataDate && hasAmount && hasTitle
  }

  getBankName(): string {
    return 'Nubank'
  }

  parse(text: string, referenceMonth: string): ParsedTransaction[] {
    const lines = text.trim().split('\n')
    const transactions: ParsedTransaction[] = []

    if (lines.length < 2) return transactions

    // Determina o separador (vírgula ou ponto-e-vírgula)
    const header = lines[0]
    const separator = header.includes(';') ? ';' : ','

    // Mapear índices das colunas a partir do cabeçalho
    const headers = header.toLowerCase().split(separator).map(h => h.trim().replace(/["']/g, ''))
    
    const dateIdx = headers.findIndex(h => h === 'date' || h === 'data')
    const titleIdx = headers.findIndex(h => h === 'title' || h === 'titulo' || h === 'título')
    const categoryIdx = headers.findIndex(h => h === 'category' || h === 'categoria')
    const amountIdx = headers.findIndex(h => h === 'amount' || h === 'valor')

    if (dateIdx === -1 || titleIdx === -1 || amountIdx === -1) {
      console.warn('[NubankCsvParser] Cabeçalho CSV inválido ou não reconhecido:', headers)
      return transactions
    }

    // Processar as linhas
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Regex para dividir respeitando vírgulas dentro de aspas duplas (ex: "Compra, Loja")
      const regex = new RegExp(`(?:^|${separator})("(?:[^"]|"")*"|[^${separator}]*)`, 'g')
      const columns: string[] = []
      let match
      while ((match = regex.exec(line)) !== null) {
        let val = match[1]
        // Se a regex casar vazio de novo no mesmo index, forçamos sair
        if (match.index === regex.lastIndex) regex.lastIndex++
        
        // Remove aspas que envolvem o campo
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"')
        }
        columns.push(val.trim())
      }

      if (columns.length <= Math.max(dateIdx, titleIdx, amountIdx)) {
        continue
      }

      const rawDate = columns[dateIdx]
      const rawTitle = columns[titleIdx]
      const rawCategory = categoryIdx !== -1 ? columns[categoryIdx] : 'Outros'
      const rawAmount = columns[amountIdx]

      // Ignorar pagamentos de fatura
      const titleLower = rawTitle.toLowerCase()
      if (titleLower.includes('pagamento') && !titleLower.includes('on line') && !titleLower.includes('online')) {
        continue
      }
      if (titleLower.includes('recebido') || titleLower.includes('pagto') || titleLower.includes('pgto')) {
        continue
      }

      // Parse Amount
      let amountStr = rawAmount.replace(/R\$/gi, '').trim()
      // Se tiver vírgula e não tiver ponto, assumimos que vírgula é o separador decimal (padrão pt-br)
      // O Nubank as vezes exporta valor fixo com ponto: 15.50
      if (amountStr.includes(',') && amountStr.indexOf(',') > amountStr.lastIndexOf('.')) {
         amountStr = amountStr.replace(/\./g, '').replace(',', '.')
      }
      const amount = parseFloat(amountStr)

      if (isNaN(amount)) continue

      // Parse Date (YYYY-MM-DD or DD/MM/YYYY)
      let formattedDate = ''
      if (rawDate.includes('/')) {
        const parts = rawDate.split('/')
        if (parts.length === 3) {
          // Assume DD/MM/YYYY
          formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        }
      } else if (rawDate.includes('-')) {
        // Assume YYYY-MM-DD
        formattedDate = rawDate
      }

      // Validação final de data
      if (!formattedDate || isNaN(Date.parse(formattedDate))) {
        continue
      }

      transactions.push({
        date: formattedDate,
        description: rawTitle,
        amount: amount,
        category: rawCategory,
        card: this.getBankName()
      })
    }

    return transactions
  }
}
