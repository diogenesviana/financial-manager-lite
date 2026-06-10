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

  async parseInvoiceText(text: string, referenceMonth: string): Promise<ParsedTransaction[]> {
    // gemini-1.5-flash é o modelo padrão, rápido e com cota gratuita abundante
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    })

    const prompt = `
Dada a seguinte fatura de cartão de crédito (em formato de texto bruto extraído de um PDF), extraia todas as transações de compras e estornos e retorne-as estritamente como um JSON array contendo objetos.
Use o mês de referência de faturamento "${referenceMonth}" (no formato YYYY-MM) para inferir o ano e o mês exatos de cada transação (ex: se uma transação ocorreu no dia 28/05 de uma fatura de referência "2026-06", a data correta deve ser "2026-05-28").

Cada objeto no array JSON deve conter exatamente os seguintes campos:
- date: a data completa no formato ISO "YYYY-MM-DD" (ex: "2026-05-28")
- description: o nome limpo do estabelecimento (remova bullets do Nubank, parcelamentos como "1/10", "1 de 10", "compra parcelada", etc. Deixe apenas o nome do local da compra, ex: "MERCADO LIVRE" ou "Uber Trip").
- amount: o valor numérico em decimal (ex: 150.00). Use valor positivo para compras/gastos e valor negativo para estornos/créditos/reembolsos (ex: -45.90).
- card: a bandeira do cartão ou nome da instituição financeira identificado (ex: "Nubank", "Itaú", "Inter"), ou null se não identificado.

Instruções Adicionais:
- Ignore pagamentos de fatura (ex: "PAGAMENTO RECEBIDO", "PAGAMENTO EFETUADO", "PGTO FATURA").
- Ignore taxas administrativas ou juros se houver, foque nas despesas de consumo.
- Garanta que todos os valores de despesa sejam positivos no campo 'amount', e os reembolsos/estornos sejam negativos.
- Retorne apenas o JSON array puro, sem qualquer outro texto ou markdown extra.

Texto da fatura:
---
${text}
---
`

    try {
      const result = await model.generateContent(prompt)
      const responseText = result.response.text()
      const parsed = JSON.parse(responseText.trim())
      if (!Array.isArray(parsed)) {
        throw new Error('A resposta do Gemini não é um JSON array válido.')
      }
      return parsed as ParsedTransaction[]
    } catch (error: any) {
      console.error('Erro na chamada do Gemini:', error)
      throw new Error('Falha ao interpretar fatura com IA: ' + error.message)
    }
  }
}
