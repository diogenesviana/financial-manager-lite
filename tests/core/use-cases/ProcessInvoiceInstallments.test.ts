import { ProcessInvoice, AssignmentRuleWithPerson, CategoryRuleData, ExistingExpense } from '@/core/use-cases/ProcessInvoice'
import { InstallmentService } from '@/core/domain/services/InstallmentService'

describe('ProcessInvoice Installments Extraction & InstallmentService Domain Tests', () => {
  let processInvoice: ProcessInvoice
  let rules: AssignmentRuleWithPerson[]
  let categoryRules: CategoryRuleData[]

  beforeEach(() => {
    processInvoice = new ProcessInvoice()
    rules = []
    categoryRules = []
  })

  it('deve extrair APENAS o gasto bruto que está no PDF (sem auto-gerar parcelas passadas ou futuras na importação)', () => {
    const parsedTransactions = [
      {
        description: 'MERCADOLIVRE*PRODUTO Parcela 2 de 5',
        amount: 50.0,
        date: '2026-06-15T00:00:00.000Z',
        card: 'Nubank',
        category: 'Lazer'
      }
    ]

    const existingExpenses: ExistingExpense[] = []

    const result = processInvoice.execute(
      parsedTransactions,
      existingExpenses,
      rules,
      categoryRules,
      '2026-06',
      'user_1'
    )

    // Deve vir exatamente 1 gasto (o do PDF)
    expect(result.expenses.length).toBe(1)
    expect(result.expenses[0].description).toBe('MERCADOLIVRE*PRODUTO Parcela 2 de 5')
    expect(result.expenses[0].month).toBe('2026-06')
  })

  it('InstallmentService deve parsear diferentes formatos de parcelamentos corretamente', () => {
    const parse1 = InstallmentService.parseInstallment('MERCADOLIVRE*COMPRA Parcela 3 de 12')
    expect(parse1).not.toBeNull()
    expect(parse1?.current).toBe(3)
    expect(parse1?.total).toBe(12)
    expect(parse1?.matchedText).toBe('Parcela 3 de 12')
    expect(parse1?.originalRoot).toBe('MERCADOLIVRE*COMPRA')

    const parse2 = InstallmentService.parseInstallment('UBER TRIP 01/03')
    expect(parse2).not.toBeNull()
    expect(parse2?.current).toBe(1)
    expect(parse2?.total).toBe(3)
    expect(parse2?.matchedText).toBe('01/03')
    expect(parse2?.originalRoot).toBe('UBER TRIP')

    const parseNonInstallment = InstallmentService.parseInstallment('COMPRA COMUM SUPERMERCADO')
    expect(parseNonInstallment).toBeNull()
  })

  it('InstallmentService deve gerar novas descrições preservando o padding de zeros', () => {
    const desc = InstallmentService.generateDescription('UBER TRIP 01/03', '01/03', 2)
    expect(desc).toBe('UBER TRIP 02/03')

    const desc2 = InstallmentService.generateDescription('ZEDELIVERY Parcela 3 de 10', 'Parcela 3 de 10', 9)
    expect(desc2).toBe('ZEDELIVERY Parcela 9 de 10')
  })

  it('InstallmentService deve limpar a indicação de parcelamento corretamente', () => {
    const clean = InstallmentService.cleanInstallmentText('MERCADOLIVRE Parcela 3 de 12 (Celular)')
    expect(clean).toBe('MERCADOLIVRE (Celular)')

    const clean2 = InstallmentService.cleanInstallmentText('Celular 02/10')
    expect(clean2).toBe('Celular')
  })

  it('InstallmentService deve projetar meses somando e subtraindo corretamente cruzando anos', () => {
    const targetMonth1 = InstallmentService.addMonthsToMonthString('2026-06', 1)
    expect(targetMonth1).toBe('2026-07')

    const targetMonth2 = InstallmentService.addMonthsToMonthString('2026-06', -6)
    expect(targetMonth2).toBe('2025-12')

    const targetMonth3 = InstallmentService.addMonthsToMonthString('2026-11', 3)
    expect(targetMonth3).toBe('2027-02')
  })
})
