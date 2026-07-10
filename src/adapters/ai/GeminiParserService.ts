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

  async parseInvoiceText(
    text: string, 
    referenceMonth: string,
    fileBuffer?: Buffer
  ): Promise<{ resolvedMonth: string; transactions: ParsedTransaction[] }> {
    if (!referenceMonth) {
      throw new Error('Mês de referência é obrigatório para processar a fatura.')
    }
    const resolvedMonth = referenceMonth

    let textToParse = text

    // Se o texto for muito curto e temos o buffer, fazemos OCR via Gemini para recuperar o texto real
    const isMultimodal = !!fileBuffer && (text.trim().length < 150)
    if (isMultimodal && fileBuffer) {
      console.log(`[Parser Strategy] Texto extraído muito curto (${text.trim().length} chars). Executando OCR via Gemini para obter o texto da fatura...`)
      textToParse = await this.performOcrWithGemini(fileBuffer)
      console.log(`[Parser Strategy] OCR concluído. Texto recuperado: ${textToParse.length} caracteres.`)
    }

    // Identificar banco e estratégia compatível
    const activeStrategy = this.strategies.find(s => s.canParse(textToParse))
    if (activeStrategy) {
      const detectedBank = activeStrategy.getBankName()
      console.log(`[Parser Strategy] Fatura identificada como ${detectedBank}. Usando parser de Regex determinístico...`)
      try {
        const localTransactions = activeStrategy.parse(textToParse, resolvedMonth)
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
    const cleanedTextForAI = this.preprocessForAI(textToParse)
    
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

    const detectedBank = 'Desconhecida'
    const prompt = `
Dada a seguinte fatura de cartão de crédito pré-processada (filtrando ruídos) ou documento PDF correspondente, extraia todas as transações de compras e estornos pertencentes ao faturamento do mês de referência: "${resolvedMonth}".

Retorne um objeto JSON estritamente com os seguintes campos:
- referenceMonth: o mês de faturamento (deve ser exatamente "${resolvedMonth}")
- transactions: um array de objetos, onde cada objeto possui:
  - date: data da transação no formato ISO "YYYY-MM-DD" (deduza o ano e mês corretos com base no referenceMonth "${resolvedMonth}" e na data da compra, ex: se referenceMonth é "2026-07" e a compra foi em "03/05", a data deve ser "2026-05-03")
  - description: nome do estabelecimento comercial limpo
  - amount: valor decimal (compras positivo, estornos/créditos negativo)
  - card: nome da instituição financeira emissora do cartão, identificada visualmente ou por texto no documento (ex: "Itaú", "Nubank", "Inter", "Mercado Pago"). Caso não seja identificável, use "Desconhecida".
  - category: infira uma categoria curta para esse gasto (ex: "Alimentação", "Transporte", "Assinaturas", "Saúde", "Lazer", "Casa", "Vestuário", "Educação", "Viagem", "Outros").

Nota importante: O faturamento de referência é exatamente "${resolvedMonth}". A fatura pertence à instituição: ${detectedBank !== 'Desconhecida' ? `"${detectedBank}"` : 'identifique a partir do logotipo ou cabeçalho do documento (ex: "Itaú")'}.
 
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
        resolvedMonth: resolvedMonth, // Utiliza estritamente o mês de destino selecionado pelo usuário
        transactions: result.transactions.map(t => ({
          ...t,
          card: t.card || 'Desconhecida'
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

  private async performOcrWithGemini(fileBuffer: Buffer): Promise<string> {
    const prompt = `
Por favor, extraia e transcreva com precisão todo o texto contido neste documento de fatura. 
Preserve a estrutura de linhas e colunas original o máximo possível. 
Retorne estritamente o texto extraído, sem resumos, sem explicações adicionais e sem introduções/conclusões.
`
    const contents = [
      {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: 'application/pdf'
        }
      },
      prompt
    ]

    try {
      const responseText = await this.executeOcrRequest(contents)
      return responseText || ''
    } catch (e: any) {
      console.error('[OCR Error] Falha ao executar OCR via Gemini:', e.message || e)
      return ''
    }
  }

  private async executeOcrRequest(contents: any[]): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0,
      },
    })

    let attempts = 0
    const maxAttempts = 3
    let delay = 2000

    while (true) {
      try {
        attempts++
        const result = await model.generateContent(contents)
        return result.response.text()
      } catch (error: any) {
        console.warn(`[Gemini OCR Retry] Tentativa ${attempts} falhou com erro: ${error.message || error}`)
        if (attempts >= maxAttempts) {
          throw error
        }
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2
      }
    }
  }
}
