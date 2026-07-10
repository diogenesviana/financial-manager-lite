import { AiParser, ParsedTransaction } from '@/core/domain/ports/AiParser'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { BankParserStrategy } from './parsers/BankParserStrategy'
import { NubankParser } from './parsers/NubankParser'
import { InterParser } from './parsers/InterParser'
import { NubankCsvParser } from './parsers/NubankCsvParser'
import { MercadoPagoParser } from './parsers/MercadoPagoParser'
import { ItauParser } from './parsers/ItauParser'

export class GeminiParserService implements AiParser {
  private genAI: GoogleGenerativeAI
  private strategies: BankParserStrategy[]

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Chave de API do Gemini (GEMINI_API_KEY) não configurada.')
    }
    this.genAI = new GoogleGenerativeAI(apiKey)
    
    // Registrando as estratégias locais suportadas (Determinísticas / Regex / CSV)
    this.strategies = [
      new NubankCsvParser(),
      new NubankParser(),
      new InterParser(),
      new MercadoPagoParser(),
      new ItauParser()
    ]
  }

  detectMonthFromText(text: string): string {
    // Procurar padrão de data de vencimento: DD/MM/AAAA ou DD/MM/AA
    const vencimentoMatch = text.match(/vencimento(?:\s+em)?(?:\s*:)?\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i)
    if (vencimentoMatch) {
      let year = vencimentoMatch[3]
      if (year.length === 2) year = '20' + year
      const month = vencimentoMatch[2].padStart(2, '0')
      return `${year}-${month}`
    }

    // Procurar nome do mês por extenso (Português)
    const monthsPt = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
    for (let i = 0; i < monthsPt.length; i++) {
      const mName = monthsPt[i]
      const regex = new RegExp(`\\b${mName}\\b(?:\\s+(?:de\\s+)?(\\d{4}))?`, 'i')
      const match = text.match(regex)
      if (match) {
        const year = match[1] || String(new Date().getFullYear())
        const monthNum = String(i + 1).padStart(2, '0')
        return `${year}-${monthNum}`
      }
    }

    // Fallback padrão para o mês atual
    return new Date().toISOString().substring(0, 7)
  }

  async parseInvoiceText(
    text: string, 
    referenceMonth: string,
    fileBuffer?: Buffer
  ): Promise<{ resolvedMonth: string; transactions: ParsedTransaction[] }> {
    let resolvedMonth = referenceMonth
    if (!resolvedMonth) {
      resolvedMonth = this.detectMonthFromText(text)
      console.log(`[Month Detection] Detectou automaticamente o mês: ${resolvedMonth}`)
    }

    // Identificar banco e estratégia compatível
    const activeStrategy = this.strategies.find(s => s.canParse(text))
    const detectedBank = activeStrategy ? activeStrategy.getBankName() : 'Desconhecida'

    if (activeStrategy) {
      console.log(`[Parser Strategy] Fatura identificada como ${detectedBank}. Usando parser de Regex determinístico...`)
      try {
        const localTransactions = activeStrategy.parse(text, resolvedMonth)
        if (localTransactions.length > 0) {
          console.log(`[Parser Strategy] ${detectedBank} extraído com sucesso em 0.00s. Quantidade: ${localTransactions.length}`)
          return {
            resolvedMonth,
            transactions: localTransactions
          }
        }
        console.log(`[Parser Strategy] Parser determinístico não retornou despesas para ${detectedBank}. Tentando Gemini como fallback...`)
      } catch (regexError) {
        console.warn(`[Parser Strategy] Erro no parser determinístico de ${detectedBank}. Tentando Gemini como fallback...`, regexError)
      }
    } else {
      console.log('[Parser Strategy] Fatura não elegível para parser determinístico. Usando Gemini como principal...')
    }

    // Fallback/Principal via IA
    // Se o texto for muito curto e temos o buffer do arquivo, informamos que usaremos o modo visual (multimodal)
    const isMultimodal = !!fileBuffer && (text.trim().length < 150)
    if (isMultimodal) {
      console.log(`[Parser Strategy] Texto extraído muito curto (${text.trim().length} chars). Ativando modo multimodal PDF com Gemini...`)
    }

    const cleanedTextForAI = this.preprocessForAI(text)
    
    // Save to scratch directory for agent analysis
    try {
      const fs = require('fs')
      const path = require('path')
      const scratchDir = path.join(process.cwd(), 'scratch')
      if (!fs.existsSync(scratchDir)) {
        fs.mkdirSync(scratchDir)
      }
      fs.writeFileSync(path.join(scratchDir, 'last_cleaned_text.txt'), cleanedTextForAI, 'utf8')
    } catch (e) {
      // ignore
    }

    const prompt = `
Dada a seguinte fatura de cartão de crédito pré-processada (filtrando ruídos), identifique o mês de referência de faturamento correspondente (no formato YYYY-MM, ex: "2026-05" para a fatura de Maio de 2026, mesmo que o vencimento seja em Junho) e extraia todas as transações de compras e estornos.

Retorne um objeto JSON estritamente com os seguintes campos:
- referenceMonth: o mês de faturamento identificado (no formato "YYYY-MM")
- transactions: um array de objetos, onde cada objeto possui:
  - date: data da transação no formato ISO "YYYY-MM-DD" (deduza o ano e mês corretos com base no referenceMonth e na data da compra, ex: se referenceMonth é "2026-05" e a compra foi em "28/04", a data deve ser "2026-04-28")
  - description: nome do estabelecimento comercial limpo
  - amount: valor decimal (compras positivo, estornos/créditos negativo)
  - card: nome do banco emissor/instituição financeira (ex: "${detectedBank}") ou null.
  - category: infira uma categoria curta para esse gasto (ex: "Alimentação", "Transporte", "Assinaturas", "Saúde", "Lazer", "Casa", "Vestuário", "Educação", "Viagem", "Outros").

Use o seguinte mês sugerido como ponto de partida para inferir o ano e o mês se necessário: "${resolvedMonth}".
A fatura pertence à instituição financeira/cartão: "${detectedBank}".
 
Fatura:
---
${isMultimodal ? '(Texto indisponível - Leia visualmente do documento PDF fornecido)' : cleanedTextForAI}
---
`

    // Prepara os inputs para o Gemini
    const contents: any[] = []
    if (fileBuffer) {
      contents.push({
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: 'application/pdf'
        }
      })
    }
    contents.push(prompt)

    const start = performance.now()
    try {
      console.log('Tentando processar fatura com o modelo gemini-2.5-flash...')
      const result = await this.executeParser(contents, 'gemini-2.5-flash')
      const duration = ((performance.now() - start) / 1000).toFixed(2)
      console.log(`[Gemini Timer] Execução do modelo gemini-2.5-flash levou: ${duration}s`)
      
      return {
        resolvedMonth: result.referenceMonth || resolvedMonth,
        transactions: result.transactions.map(t => ({
          ...t,
          card: t.card || (detectedBank !== 'Desconhecida' ? detectedBank : null)
        }))
      }
    } catch (error: any) {
      console.error('Erro no modelo gemini-2.5-flash.', error.message || error)
      throw new Error('Falha ao interpretar fatura com IA: ' + error.message)
    }
  }

  private preprocessForAI(text: string): string {
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
          lower.includes('custo efetivo total') ||
          lower.includes('cet a.a.') ||
          lower.includes('tabela de juros')

        if (isBoilerplate) return false

        const hasDate = /\b\d{1,2}[\/\-\s]+/.test(line)
        const hasAmount = /\b\d+[\.,]\s*\d{2}\b/.test(line)
        
        return hasDate || hasAmount
      })

    return cleanedLines.join('\n')
  }

  private async executeParser(prompt: string | any[], modelName: string): Promise<{ referenceMonth: string; transactions: ParsedTransaction[] }> {
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
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('A resposta do Gemini não é um JSON object válido.')
        }
        if (!parsed.referenceMonth || !Array.isArray(parsed.transactions)) {
          throw new Error('A resposta do Gemini não contém os campos referenceMonth e transactions.')
        }
        return parsed as { referenceMonth: string; transactions: ParsedTransaction[] }
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
