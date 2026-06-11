import { AiParser, ParsedTransaction } from '@/core/domain/ports/AiParser'
import { GoogleGenerativeAI } from '@google/generative-ai'

export class GeminiParserService implements AiParser {
  private genAI: GoogleGenerativeAI

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Chave de API do Gemini (GEMINI_API_KEY) não configurada.')
    }
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  private preprocessText(text: string): string {
    if (!text) return ''
    
    const isNubank = text.toLowerCase().includes('nubank')
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

        const isAdditionalNoise =
          lower.includes('pagamento recebido') ||
          lower.includes('pagamento efetuado') ||
          lower.includes('pagamento de fatura') ||
          lower.includes('pagto fatura') ||
          lower.includes('pgto fatura') ||
          lower.includes('pagto') ||
          lower.includes('saldo') ||
          lower.includes('total') ||
          lower.includes('vencimento') ||
          lower.includes('limite') ||
          lower.includes('fatura anterior') ||
          lower.includes('encargos') ||
          lower.includes('juros') ||
          lower.includes('multa') ||
          lower.includes(' iof ') ||
          lower.includes('tributo') ||
          lower.includes('subtotal') ||
          lower.includes('crédito rotativo')

        if (isBoilerplate || isAdditionalNoise) return false

        // Match date pattern: dd/mm, dd mmm, dd-mmm, dd/mm/yyyy (including dd de mmm)
        const hasDate = /\b\d{1,2}[\/\-\s]+(?:de\s+)?([jJ][aA][nN]|[fF][eE][vV]|[mM][aA][rR]|[aA][bB][rR]|[mM][aA][iI]|[jJ][uU][nN]|[jJ][uU][lL]|[aA][gG][oO]|[sS][eE][tT]|[oO][uU][tT]|[nN][oO][vV]|[dD][eE][zZ]|[aA][nN][oO]|[dD][iI][aA])\b|\b\d{1,2}\/\d{1,2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(line)
        
        // Match numbers with comma/dot (monetary/price amount)
        const hasAmount = /\b\d+[\.,]\s*\d{2}\b/.test(line)

        // For Nubank, require both date AND amount on the same line to keep it (local regex/AI optimization).
        // For other banks, keep lines containing either date OR amount to allow AI to parse multi-line splits.
        return isNubank ? (hasDate && hasAmount) : (hasDate || hasAmount)
      })

    return cleanedLines.join('\n')
  }

  async parseInvoiceText(text: string, referenceMonth: string): Promise<ParsedTransaction[]> {
    const cleanedText = this.preprocessText(text)
    
    console.log(`[Token Opt] Texto original: ${text.length} caracteres. Texto pré-processado: ${cleanedText.length} caracteres. Redução de ${((1 - cleanedText.length / (text.length || 1)) * 100).toFixed(1)}%`)
    
    // Save to scratch directory for agent analysis
    try {
      const fs = require('fs')
      const path = require('path')
      const scratchDir = path.join(process.cwd(), 'scratch')
      if (!fs.existsSync(scratchDir)) {
        fs.mkdirSync(scratchDir)
      }
      fs.writeFileSync(path.join(scratchDir, 'last_cleaned_text.txt'), cleanedText, 'utf8')
      console.log('[Debug] cleanedText salvo em scratch/last_cleaned_text.txt')
    } catch (e) {
      console.error('[Debug] Falha ao salvar cleanedText:', e)
    }

    // Detect card institution beforehand from the raw text
    let detectedCard: string | null = null
    const lowerText = text.toLowerCase()
    if (lowerText.includes('nubank')) {
      detectedCard = 'Nubank'
    } else if (lowerText.includes('itau') || lowerText.includes('itaú')) {
      detectedCard = 'Itaú'
    } else if (lowerText.includes('bradesco')) {
      detectedCard = 'Bradesco'
    } else if (lowerText.includes('santander')) {
      detectedCard = 'Santander'
    } else if (lowerText.includes('inter')) {
      detectedCard = 'Inter'
    } else if (lowerText.includes('c6')) {
      detectedCard = 'C6 Bank'
    }

    const isNubank = detectedCard === 'Nubank'
    const isInter = detectedCard === 'Inter'
    const useLocalParserAsPrimary = isNubank || isInter

    if (useLocalParserAsPrimary) {
      const bankName = isNubank ? 'Nubank' : 'Inter'
      console.log(`[Parser Strategy] Fatura identificada como ${bankName}. Usando parser de Regex local como principal...`)
      try {
        const localTransactions = this.parseWithRegex(cleanedText, referenceMonth, detectedCard)
        if (localTransactions.length > 0) {
          console.log(`[Parser Strategy] ${bankName} extraído com sucesso via Regex local em 0.00s. Quantidade: ${localTransactions.length}`)
          return localTransactions
        }
        console.log(`[Parser Strategy] Parser de Regex local não retornou despesas para ${bankName}. Tentando Gemini como fallback...`)
      } catch (regexError) {
        console.warn(`[Parser Strategy] Erro no parser de Regex do ${bankName}. Tentando Gemini como fallback...`, regexError)
      }
    } else {
      console.log('[Parser Strategy] Fatura não elegível para parser local direto. Usando Gemini como principal...')
    }

    const prompt = `
Dada a seguinte fatura de cartão de crédito pré-processada (filtrando ruídos), extraia todas as transações de compras e estornos e retorne-as estritamente como um JSON array de objetos.
Use o mês de referência de faturamento "${referenceMonth}" (no formato YYYY-MM) para inferir o ano e o mês de cada transação (ex: transação em 28/05 em fatura "2026-06" deve ser "2026-05-28").
A fatura pertence à instituição financeira/cartão: "${detectedCard || 'Desconhecida'}".

JSON array deve ter objetos com:
- date: formato ISO "YYYY-MM-DD"
- description: nome do estabelecimento comercial limpo
- amount: valor decimal (compras positivo, estornos/créditos negativo)
- card: nome do banco emissor/instituição financeira (ex: "${detectedCard || 'Inter'}") ou null.

Fatura pré-processada:
---
${cleanedText}
---
`

    const start = performance.now()
    try {
      console.log('Tentando processar fatura com o modelo principal gemini-2.5-flash...')
      const result = await this.executeParser(prompt, 'gemini-2.5-flash')
      const duration = ((performance.now() - start) / 1000).toFixed(2)
      console.log(`[Gemini Timer] Execução do modelo gemini-2.5-flash levou: ${duration}s`)
      
      // Map over transactions to guarantee card is set
      return result.map(t => ({
        ...t,
        card: t.card || detectedCard
      }))
    } catch (error: any) {
      console.error('Erro no modelo gemini-2.5-flash. Iniciando fallback local via Expressão Regular...', error.message || error)
      try {
        const localTransactions = this.parseWithRegex(cleanedText, referenceMonth, detectedCard)
        console.log(`[Local Fallback] Sucesso! Extraídas ${localTransactions.length} despesas localmente em 0.00s usando Regex.`)
        if (localTransactions.length === 0) {
          throw new Error('Nenhuma transação pôde ser extraída localmente pelo parser de Regex.')
        }
        return localTransactions
      } catch (fallbackError: any) {
        console.error('Falha no fallback local:', fallbackError)
        throw new Error('Falha ao interpretar fatura com IA e falha no processador local: ' + error.message)
      }
    }
  }

  private parseWithRegex(text: string, referenceMonth: string, detectedCard: string | null): ParsedTransaction[] {
    const lines = text.split('\n')
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

    console.log(`[Regex Debug] Iniciando análise de ${lines.length} linhas para o banco: ${detectedCard}`)

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

        // Remove card digits suffix if any (e.g. *1234 or 1234)
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

          // Para o Banco Inter, os sinais no PDF são invertidos: compras vêm com "-" (ou como hífen de separador) e créditos/estornos com "+" (ou sem sinal).
          // Precisamos inverter para o padrão do nosso sistema (compras positivas, créditos/estornos negativos).
          if (detectedCard === 'Inter') {
            amount = -amount
          }

          transactions.push({
            date: formattedDate,
            description: description,
            amount: amount,
            card: detectedCard
          })
          console.log(`[Regex Match Success] Adicionado: ${formattedDate} | ${description} | ${amount} | ${detectedCard}`)
        }
      }
    }
    return transactions
  }

  private async executeParser(prompt: string, modelName: string): Promise<ParsedTransaction[]> {
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    })

    let attempts = 0
    const maxAttempts = 3
    let delay = 2000 // 2 seconds starting delay

    while (true) {
      try {
        attempts++
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        const parsed = JSON.parse(responseText.trim())
        if (!Array.isArray(parsed)) {
          throw new Error('A resposta do Gemini não é um JSON array válido.')
        }
        return parsed as ParsedTransaction[]
      } catch (error: any) {
        console.warn(`[Gemini Retry] Tentativa ${attempts} falhou com erro: ${error.message || error}`)
        if (attempts >= maxAttempts) {
          throw error
        }
        console.log(`Aguardando ${delay / 1000}s antes de tentar novamente...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2
      }
    }
  }
}
