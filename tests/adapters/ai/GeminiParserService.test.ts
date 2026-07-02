/**
 * Testes unitários para o GeminiParserService.
 * 
 * Foco: detectMonthFromText e parseWithRegex — as duas funções que
 * rodam localmente sem chamar a API do Gemini, e que causaram o bug
 * do mês errado (2024-01 em vez de 2026-06).
 */
import { GeminiParserService } from '@/adapters/ai/GeminiParserService'

// Precisamos instanciar sem a API key real para os testes unitários.
// Vamos mockar o construtor para não lançar erro.
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({}))
}))

// Forçar a variável de ambiente para o construtor não falhar
process.env.GEMINI_API_KEY = 'test-key'

describe('GeminiParserService', () => {
  let service: GeminiParserService

  beforeEach(() => {
    service = new GeminiParserService()
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // detectMonthFromText
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('detectMonthFromText', () => {
    it('deve detectar mês a partir de "vencimento DD/MM/AAAA"', () => {
      const text = 'Fatura com vencimento 10/07/2026 no valor de R$ 1.500,00'
      expect(service.detectMonthFromText(text)).toBe('2026-07')
    })

    it('deve detectar mês a partir de "vencimento em DD/MM/AAAA"', () => {
      const text = 'Vencimento em 15/06/2026'
      expect(service.detectMonthFromText(text)).toBe('2026-06')
    })

    it('deve detectar mês a partir de "vencimento: DD/MM/AAAA"', () => {
      const text = 'Vencimento: 05/01/2026'
      expect(service.detectMonthFromText(text)).toBe('2026-01')
    })

    it('deve lidar com ano de 2 dígitos (DD/MM/AA)', () => {
      const text = 'vencimento 10/03/26'
      expect(service.detectMonthFromText(text)).toBe('2026-03')
    })

    it('deve detectar mês por extenso em português', () => {
      const text = 'Fatura de junho de 2026'
      expect(service.detectMonthFromText(text)).toBe('2026-06')
    })

    it('deve detectar mês por extenso sem ano (usar ano atual)', () => {
      const text = 'Fatura referente a março'
      const result = service.detectMonthFromText(text)
      expect(result).toMatch(/^\d{4}-03$/)
    })

    it('deve detectar "janeiro" corretamente', () => {
      const text = 'janeiro de 2025'
      expect(service.detectMonthFromText(text)).toBe('2025-01')
    })

    it('deve detectar "dezembro" corretamente', () => {
      const text = 'dezembro 2026'
      expect(service.detectMonthFromText(text)).toBe('2026-12')
    })

    it('deve retornar mês atual como fallback quando nenhum padrão é encontrado', () => {
      const text = 'Texto sem nenhuma data ou mês reconhecível'
      const result = service.detectMonthFromText(text)
      const expected = new Date().toISOString().substring(0, 7)
      expect(result).toBe(expected)
    })

    it('deve priorizar "vencimento" sobre mês por extenso', () => {
      // Se o texto tem "vencimento 10/07/2026" E "junho", deve pegar julho
      const text = 'Fatura de junho vencimento 10/07/2026'
      expect(service.detectMonthFromText(text)).toBe('2026-07')
    })
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BankParserStrategy (Regex Determinístico)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('BankParserStrategies', () => {
    // Importando para o escopo do teste
    const { NubankParser } = require('@/adapters/ai/parsers/NubankParser')
    const { InterParser } = require('@/adapters/ai/parsers/InterParser')
    const { MercadoPagoParser } = require('@/adapters/ai/parsers/MercadoPagoParser')
    
    const callParseWithRegex = (
      text: string,
      refMonth: string,
      card: string | null
    ) => {
      let parser
      if (card === 'Nubank' || card === null) {
        parser = new NubankParser()
      } else if (card === 'Mercado Pago') {
        parser = new MercadoPagoParser()
      } else {
        parser = new InterParser()
      }
      return parser.parse(text, refMonth)
    }

    it('deve extrair transação básica no formato Nubank (DD/MM descrição valor)', () => {
      const text = '16/05 Uber *Trip 23,50'
      const result = callParseWithRegex(text, '2026-05', 'Nubank')
      expect(result).toHaveLength(1)
      expect(result[0].description).toContain('Uber')
      expect(result[0].amount).toBe(23.50)
      expect(result[0].date).toBe('2026-05-16')
      expect(result[0].card).toBe('Nubank')
    })

    it('deve extrair múltiplas transações', () => {
      const text = [
        '16/05 Uber *Trip 23,50',
        '17/05 iFood 45,90',
        '18/05 Spotify 19,90'
      ].join('\n')
      const result = callParseWithRegex(text, '2026-05', 'Nubank')
      expect(result).toHaveLength(3)
    })

    it('deve ignorar pagamentos de fatura', () => {
      const text = [
        '16/05 Pagamento recebido 1500,00',
        '17/05 iFood 45,90'
      ].join('\n')
      const result = callParseWithRegex(text, '2026-05', 'Nubank')
      expect(result).toHaveLength(1)
      expect(result[0].description).toContain('iFood')
    })

    it('deve lidar com valores com separador de milhar (1.234,56)', () => {
      const text = '20/05 Compra Grande 1.234,56'
      const result = callParseWithRegex(text, '2026-05', 'Nubank')
      expect(result).toHaveLength(1)
      expect(result[0].amount).toBe(1234.56)
    })

    it('deve inverter sinais para o Banco Inter', () => {
      const text = '20/05 Compra Inter -150,00'
      const result = callParseWithRegex(text, '2026-05', 'Inter')
      expect(result).toHaveLength(1)
      // Inter inverte: -150 vira 150 (compra positiva)
      expect(result[0].amount).toBe(150.00)
    })

    it('deve ignorar datas inválidas (dia > 31)', () => {
      const text = '93/05 Bug Date 10,00'
      const result = callParseWithRegex(text, '2026-05', 'Nubank')
      expect(result).toHaveLength(0)
    })

    it('deve ignorar meses inválidos (mês > 12)', () => {
      const text = '10/15 Bug Month 10,00'
      const result = callParseWithRegex(text, '2026-05', 'Nubank')
      expect(result).toHaveLength(0)
    })

    it('deve tratar transações que cruzam a virada de ano (dez -> jan)', () => {
      // Se o mês de referência é janeiro, e a data é 28/12, o ano deve ser o anterior
      const text = '28/12 Compra Natalina 99,90'
      const result = callParseWithRegex(text, '2026-01', 'Nubank')
      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2025-12-28')
    })

    it('deve tratar transações com data com nome de mês abreviado (DD MMM)', () => {
      const text = '15 mai Restaurante ABC 85,50'
      const result = callParseWithRegex(text, '2026-05', null)
      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2026-05-15')
      expect(result[0].amount).toBe(85.50)
    })

    it('deve retornar array vazio para texto sem transações', () => {
      const text = 'Este é um texto qualquer sem nenhuma transação'
      const result = callParseWithRegex(text, '2026-05', 'Nubank')
      expect(result).toHaveLength(0)
    })

    it('deve limpar prefixos de cartão (ex: *1234) da descrição', () => {
      const text = '16/05 1234 Uber *Trip 23,50'
      const result = callParseWithRegex(text, '2026-05', 'Nubank')
      expect(result).toHaveLength(1)
      // Não deve conter "1234" no início da descrição
      expect(result[0].description).not.toMatch(/^1234/)
    })

    describe('MercadoPagoParser', () => {
      it('deve identificar fatura do Mercado Pago pelo canParse', () => {
        const parser = new MercadoPagoParser()
        expect(parser.canParse('Fatura de cartão de crédito Mercado Pago')).toBe(true)
        expect(parser.canParse('Fatura de cartão mercadopago')).toBe(true)
        expect(parser.canParse('Fatura de outro banco')).toBe(false)
      })

      it('deve extrair transações normais e manter valores positivos para compras', () => {
        const text = [
          '28/11 MERCADOLIVRE*2PRODUTOS Parcela 7 de 14 R$ 113,64',
          '27/05 MERCADOLIVRE*MERCADOLIVRE Parcela 1 de 12 R$ 41,50'
        ].join('\n')
        
        const result = callParseWithRegex(text, '2026-07', 'Mercado Pago')
        
        expect(result).toHaveLength(2)
        expect(result[0].description).toBe('MERCADOLIVRE*2PRODUTOS Parcela 7 de 14')
        expect(result[0].amount).toBe(113.64)
        expect(result[0].card).toBe('Mercado Pago')
        expect(result[0].date).toBe('2026-11-28')

        expect(result[1].description).toBe('MERCADOLIVRE*MERCADOLIVRE Parcela 1 de 12')
        expect(result[1].amount).toBe(41.50)
        expect(result[1].card).toBe('Mercado Pago')
        expect(result[1].date).toBe('2026-05-27')
      })

      it('deve ignorar resumos de consumo e pagamentos de fatura', () => {
        const text = [
          '17/05 Pagamento da fatura de maio/2026 R$ 113,64',
          'Consumos de 16/05 a 15/06 R$ 155,14',
          '27/05 MERCADOLIVRE*MERCADOLIVRE Parcela 1 de 12 R$ 41,50'
        ].join('\n')

        const result = callParseWithRegex(text, '2026-07', 'Mercado Pago')
        
        expect(result).toHaveLength(1)
        expect(result[0].description).toBe('MERCADOLIVRE*MERCADOLIVRE Parcela 1 de 12')
        expect(result[0].amount).toBe(41.50)
      })
    })

    describe('InterParser', () => {
      it('deve identificar fatura do Inter pelo canParse com limite de palavra', () => {
        const parser = new InterParser()
        expect(parser.canParse('Fatura de cartão de crédito Inter')).toBe(true)
        expect(parser.canParse('BANCO INTER S.A.')).toBe(true)
        expect(parser.canParse('Compras internacionais e tarifas')).toBe(false)
        expect(parser.canParse('Acesso via internet banking')).toBe(false)
      })
    })
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // NubankCsvParser (Estratégia CSV)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('NubankCsvParser', () => {
    const { NubankCsvParser } = require('@/adapters/ai/parsers/NubankCsvParser')
    const parser = new NubankCsvParser()

    it('deve rejeitar texto que não seja CSV', () => {
      const text = 'texto qualquer sem virgulas\nlinha 2'
      expect(parser.canParse(text)).toBe(false)
    })

    it('deve aceitar CSV com cabeçalhos corretos do Nubank (inglês)', () => {
      const text = 'date,category,title,amount\n2026-06-15,Alimentação,iFood,45.90'
      expect(parser.canParse(text)).toBe(true)
    })

    it('deve aceitar CSV com cabeçalhos corretos do Nubank (português)', () => {
      const text = 'data,categoria,titulo,valor\n2026-06-15,Alimentação,iFood,45.90'
      expect(parser.canParse(text)).toBe(true)
    })

    it('deve extrair transações corretamente', () => {
      const text = `date,category,title,amount\n2026-06-15,Alimentação,iFood,45.90\n2026-06-16,Transporte,Uber,15.50`
      const result = parser.parse(text, '2026-06')
      expect(result).toHaveLength(2)
      expect(result[0].description).toBe('iFood')
      expect(result[0].amount).toBe(45.9)
      expect(result[0].date).toBe('2026-06-15')
      expect(result[1].description).toBe('Uber')
      expect(result[1].amount).toBe(15.5)
    })

    it('deve lidar com valores pt-br', () => {
      const text = `data,categoria,titulo,valor\n15/06/2026,Alimentação,Mercado,"1.234,56"`
      const result = parser.parse(text, '2026-06')
      expect(result).toHaveLength(1)
      expect(result[0].amount).toBe(1234.56)
      expect(result[0].date).toBe('2026-06-15')
    })

    it('deve ignorar pagamento de fatura', () => {
      const text = `date,category,title,amount\n2026-06-15,Pagamento,Pagamento Recebido,1500.00`
      const result = parser.parse(text, '2026-06')
      expect(result).toHaveLength(0)
    })
  })
})
