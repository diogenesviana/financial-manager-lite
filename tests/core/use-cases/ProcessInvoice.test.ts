/**
 * Testes unitários para o Use Case ProcessInvoice.
 * 
 * Valida toda a lógica de negócio central:
 * - Deduplicação de despesas importadas
 * - Atribuição automática via regras (AssignmentRule)
 * - Definição de sharedStatus (PENDING vs ACCEPTED)
 * - Categorização automática (CategoryRule)
 */
import {
  ProcessInvoice,
  AssignmentRuleWithPerson,
  CategoryRuleData,
  ExistingExpense,
} from '@/core/use-cases/ProcessInvoice'
import { ParsedTransaction } from '@/core/domain/ports/AiParser'

describe('ProcessInvoice', () => {
  let useCase: ProcessInvoice

  const USER_ID = 'user-123'
  const MONTH = '2026-06'

  // Helpers para criar dados de teste
  const makeParsed = (overrides: Partial<ParsedTransaction> = {}): ParsedTransaction => ({
    date: '2026-06-15',
    description: 'Uber Trip',
    amount: 25.50,
    card: 'Nubank',
    category: 'Transporte',
    ...overrides,
  })

  const makeExisting = (overrides: Partial<ExistingExpense> = {}): ExistingExpense => ({
    id: 'existing-1',
    date: new Date('2026-06-15'),
    description: 'Uber Trip',
    amount: 25.50,
    card: 'Nubank',
    ...overrides,
  })

  const makeRule = (overrides: Partial<AssignmentRuleWithPerson> = {}): AssignmentRuleWithPerson => ({
    id: 'rule-1',
    keyword: 'uber',
    personId: 'person-dayse',
    person: {
      id: 'person-dayse',
      name: 'Dayse',
      linkedUserId: null,
      linkStatus: 'NONE',
    },
    ...overrides,
  })

  const makeCatRule = (overrides: Partial<CategoryRuleData> = {}): CategoryRuleData => ({
    id: 'cat-1',
    keyword: 'uber',
    category: 'Transporte',
    userId: USER_ID,
    ...overrides,
  })

  beforeEach(() => {
    useCase = new ProcessInvoice()
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Cenários básicos
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('cenários básicos', () => {
    it('deve processar uma transação simples sem regras', () => {
      const result = useCase.execute(
        [makeParsed()],
        [],  // sem existentes
        [],  // sem regras
        [],  // sem cat rules
        MONTH,
        USER_ID
      )

      expect(result.expenses).toHaveLength(1)
      expect(result.expenses[0].description).toBe('Uber Trip')
      expect(result.expenses[0].amount).toBe(25.50)
      expect(result.expenses[0].personId).toBeNull()
      expect(result.expenses[0].sharedStatus).toBe('ACCEPTED')
      expect(result.expenses[0].isManual).toBe(false)
      expect(result.expenses[0].month).toBe(MONTH)
      expect(result.expenses[0].userId).toBe(USER_ID)
      expect(result.skippedDuplicates).toBe(0)
      expect(result.autoAssigned).toBe(0)
    })

    it('deve processar múltiplas transações', () => {
      const transactions = [
        makeParsed({ description: 'Uber Trip', amount: 25.50 }),
        makeParsed({ description: 'iFood Pedido', amount: 45.90, date: '2026-06-16' }),
        makeParsed({ description: 'Spotify', amount: 19.90, date: '2026-06-17' }),
      ]
      const result = useCase.execute(transactions, [], [], [], MONTH, USER_ID)
      expect(result.expenses).toHaveLength(3)
    })

    it('deve retornar lista vazia se não receber transações', () => {
      const result = useCase.execute([], [], [], [], MONTH, USER_ID)
      expect(result.expenses).toHaveLength(0)
      expect(result.skippedDuplicates).toBe(0)
    })
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Deduplicação
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('deduplicação', () => {
    it('deve ignorar transação idêntica a uma existente no banco', () => {
      const existing = [makeExisting()]
      const parsed = [makeParsed()]

      const result = useCase.execute(parsed, existing, [], [], MONTH, USER_ID)
      expect(result.expenses).toHaveLength(0)
      expect(result.skippedDuplicates).toBe(1)
    })

    it('NÃO deve considerar duplicata se a descrição for diferente', () => {
      const existing = [makeExisting({ description: 'Uber Eats' })]
      const parsed = [makeParsed({ description: 'Uber Trip' })]

      const result = useCase.execute(parsed, existing, [], [], MONTH, USER_ID)
      expect(result.expenses).toHaveLength(1)
      expect(result.skippedDuplicates).toBe(0)
    })

    it('NÃO deve considerar duplicata se o valor for diferente', () => {
      const existing = [makeExisting({ amount: 30.00 })]
      const parsed = [makeParsed({ amount: 25.50 })]

      const result = useCase.execute(parsed, existing, [], [], MONTH, USER_ID)
      expect(result.expenses).toHaveLength(1)
    })

    it('deve considerar duplicata se a descrição original bater com o PDF', () => {
      // Gasto foi editado na interface (description mudou), mas a originalDescription mantém o valor base do PDF
      const existing = [makeExisting({ description: 'Uber Trip (Viagem)', originalDescription: 'Uber Trip' })]
      const parsed = [makeParsed({ description: 'Uber Trip' })]

      const result = useCase.execute(parsed, existing, [], [], MONTH, USER_ID)
      expect(result.expenses).toHaveLength(0)
      expect(result.skippedDuplicates).toBe(1)
    })

    it('deve considerar duplicata se o valor original bater com o PDF', () => {
      // Gasto foi editado na interface (amount mudou), mas o originalAmount mantém o valor base do PDF
      const existing = [makeExisting({ amount: 10.00, originalAmount: 25.50 })]
      const parsed = [makeParsed({ amount: 25.50 })]

      const result = useCase.execute(parsed, existing, [], [], MONTH, USER_ID)
      expect(result.expenses).toHaveLength(0)
      expect(result.skippedDuplicates).toBe(1)
    })

    it('NÃO deve considerar duplicata se a data for diferente', () => {
      const existing = [makeExisting({ date: new Date('2026-06-20') })]
      const parsed = [makeParsed({ date: '2026-06-15' })]

      const result = useCase.execute(parsed, existing, [], [], MONTH, USER_ID)
      expect(result.expenses).toHaveLength(1)
    })

    it('NÃO deve considerar duplicata se o cartão for diferente', () => {
      const existing = [makeExisting({ card: 'Itaú' })]
      const parsed = [makeParsed({ card: 'Nubank' })]

      const result = useCase.execute(parsed, existing, [], [], MONTH, USER_ID)
      expect(result.expenses).toHaveLength(1)
    })

    it('deve tratar case-insensitive na comparação de descrições', () => {
      const existing = [makeExisting({ description: 'UBER TRIP' })]
      const parsed = [makeParsed({ description: 'uber trip' })]

      const result = useCase.execute(parsed, existing, [], [], MONTH, USER_ID)
      expect(result.expenses).toHaveLength(0)
      expect(result.skippedDuplicates).toBe(1)
    })

    it('deve permitir 2 transações idênticas no PDF se houver apenas 1 existente', () => {
      // Cenário: duas compras no mesmo valor/data/desc (ex: 2 Ubers no mesmo dia)
      // e apenas 1 já existe no banco. A segunda deve ser criada.
      const existing = [makeExisting({ id: 'exp-1' })]
      const parsed = [
        makeParsed(),  // idêntica à existente -> duplicata
        makeParsed(),  // segunda idêntica -> NÃO é duplicata pois a existente já foi "consumida"
      ]

      const result = useCase.execute(parsed, existing, [], [], MONTH, USER_ID)
      expect(result.expenses).toHaveLength(1) // a segunda passa
      expect(result.skippedDuplicates).toBe(1) // a primeira é ignorada
    })

    it('deve ignorar ambas se houver 2 existentes e 2 idênticas no PDF', () => {
      const existing = [
        makeExisting({ id: 'exp-1' }),
        makeExisting({ id: 'exp-2' }),
      ]
      const parsed = [makeParsed(), makeParsed()]

      const result = useCase.execute(parsed, existing, [], [], MONTH, USER_ID)
      expect(result.expenses).toHaveLength(0)
      expect(result.skippedDuplicates).toBe(2)
    })
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Atribuição Automática (AssignmentRules)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('atribuição automática', () => {
    it('deve atribuir personId quando a keyword bate com a descrição', () => {
      const rules = [makeRule({ keyword: 'uber', personId: 'person-dayse' })]
      const result = useCase.execute(
        [makeParsed({ description: 'Uber Trip' })],
        [], rules, [], MONTH, USER_ID
      )
      expect(result.expenses[0].personId).toBe('person-dayse')
      expect(result.autoAssigned).toBe(1)
    })

    it('deve ser case-insensitive na correspondência de keyword', () => {
      const rules = [makeRule({ keyword: 'UBER', personId: 'person-dayse' })]
      const result = useCase.execute(
        [makeParsed({ description: 'uber trip' })],
        [], rules, [], MONTH, USER_ID
      )
      expect(result.expenses[0].personId).toBe('person-dayse')
    })

    it('deve deixar personId null se nenhuma regra bater', () => {
      const rules = [makeRule({ keyword: 'spotify' })]
      const result = useCase.execute(
        [makeParsed({ description: 'Uber Trip' })],
        [], rules, [], MONTH, USER_ID
      )
      expect(result.expenses[0].personId).toBeNull()
      expect(result.autoAssigned).toBe(0)
    })

    it('deve usar a primeira regra que bater quando há múltiplas', () => {
      const rules = [
        makeRule({ keyword: 'uber', personId: 'person-1' }),
        makeRule({ keyword: 'trip', personId: 'person-2' }),
      ]
      const result = useCase.execute(
        [makeParsed({ description: 'Uber Trip' })],
        [], rules, [], MONTH, USER_ID
      )
      // A primeira regra (uber) bate primeiro
      expect(result.expenses[0].personId).toBe('person-1')
    })

    it('deve atribuir regras diferentes para transações diferentes', () => {
      const rules = [
        makeRule({ keyword: 'uber', personId: 'person-dayse' }),
        makeRule({ keyword: 'ifood', personId: 'person-diogenes' }),
      ]
      const result = useCase.execute(
        [
          makeParsed({ description: 'Uber Trip' }),
          makeParsed({ description: 'iFood Pedido', date: '2026-06-16', amount: 45.90 }),
        ],
        [], rules, [], MONTH, USER_ID
      )
      expect(result.expenses[0].personId).toBe('person-dayse')
      expect(result.expenses[1].personId).toBe('person-diogenes')
      expect(result.autoAssigned).toBe(2)
    })
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SharedStatus (PENDING vs ACCEPTED)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('sharedStatus', () => {
    it('deve ser ACCEPTED quando não há regra de atribuição (personId null)', () => {
      const result = useCase.execute(
        [makeParsed()],
        [], [], [], MONTH, USER_ID
      )
      expect(result.expenses[0].sharedStatus).toBe('ACCEPTED')
    })

    it('deve ser ACCEPTED quando a pessoa é um membro local (sem linkedUserId)', () => {
      const rules = [makeRule({
        person: { id: 'p1', name: 'Local', linkedUserId: null, linkStatus: 'NONE' }
      })]
      const result = useCase.execute(
        [makeParsed({ description: 'Uber Trip' })],
        [], rules, [], MONTH, USER_ID
      )
      expect(result.expenses[0].sharedStatus).toBe('ACCEPTED')
    })

    it('deve ser PENDING quando a pessoa está vinculada a outro usuário do sistema', () => {
      const rules = [makeRule({
        person: { id: 'p1', name: 'Dayse', linkedUserId: 'user-456', linkStatus: 'ACCEPTED' }
      })]
      const result = useCase.execute(
        [makeParsed({ description: 'Uber Trip' })],
        [], rules, [], MONTH, USER_ID
      )
      expect(result.expenses[0].sharedStatus).toBe('PENDING')
    })

    it('deve ser ACCEPTED quando o convite está pendente (linkStatus != ACCEPTED)', () => {
      const rules = [makeRule({
        person: { id: 'p1', name: 'Dayse', linkedUserId: 'user-456', linkStatus: 'PENDING' }
      })]
      const result = useCase.execute(
        [makeParsed({ description: 'Uber Trip' })],
        [], rules, [], MONTH, USER_ID
      )
      expect(result.expenses[0].sharedStatus).toBe('ACCEPTED')
    })

    it('deve ser ACCEPTED quando o convite foi rejeitado', () => {
      const rules = [makeRule({
        person: { id: 'p1', name: 'Dayse', linkedUserId: 'user-456', linkStatus: 'REJECTED' }
      })]
      const result = useCase.execute(
        [makeParsed({ description: 'Uber Trip' })],
        [], rules, [], MONTH, USER_ID
      )
      expect(result.expenses[0].sharedStatus).toBe('ACCEPTED')
    })

    it('deve ser ACCEPTED quando a regra existe mas person é null', () => {
      const rules = [makeRule({ person: null })]
      const result = useCase.execute(
        [makeParsed({ description: 'Uber Trip' })],
        [], rules, [], MONTH, USER_ID
      )
      expect(result.expenses[0].sharedStatus).toBe('ACCEPTED')
    })
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Categorização Automática
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('categorização automática', () => {
    it('deve usar a categoria da regra quando keyword bate', () => {
      const catRules = [makeCatRule({ keyword: 'uber', category: 'Transporte' })]
      const result = useCase.execute(
        [makeParsed({ description: 'Uber Trip', category: 'Viagem' })],
        [], [], catRules, MONTH, USER_ID
      )
      // A regra de categoria deve prevalecer sobre a sugestão da IA
      expect(result.expenses[0].category).toBe('Transporte')
    })

    it('deve usar a categoria da IA quando nenhuma regra bate', () => {
      const catRules = [makeCatRule({ keyword: 'spotify', category: 'Assinaturas' })]
      const result = useCase.execute(
        [makeParsed({ description: 'Uber Trip', category: 'Transporte' })],
        [], [], catRules, MONTH, USER_ID
      )
      expect(result.expenses[0].category).toBe('Transporte')
    })

    it('deve usar "Outros" como fallback quando nem regra nem IA sugerem', () => {
      const result = useCase.execute(
        [makeParsed({ description: 'Compra Desconhecida', category: undefined })],
        [], [], [], MONTH, USER_ID
      )
      expect(result.expenses[0].category).toBe('Outros')
    })

    it('deve sugerir nova regra de categoria se a IA propôs e não existe regra', () => {
      const result = useCase.execute(
        [makeParsed({ description: 'Spotify Premium', category: 'Assinaturas' })],
        [], [], [], MONTH, USER_ID
      )
      expect(result.newCategoryRules).toHaveLength(1)
      expect(result.newCategoryRules[0].keyword).toBe('spotify')
      expect(result.newCategoryRules[0].category).toBe('Assinaturas')
    })

    it('NÃO deve sugerir nova regra se a categoria da IA for "Outros"', () => {
      const result = useCase.execute(
        [makeParsed({ description: 'Compra Xpto', category: 'Outros' })],
        [], [], [], MONTH, USER_ID
      )
      expect(result.newCategoryRules).toHaveLength(0)
    })

    it('NÃO deve sugerir nova regra se keyword for muito curta (<=2 chars)', () => {
      const result = useCase.execute(
        [makeParsed({ description: 'AB Premium', category: 'Assinaturas' })],
        [], [], [], MONTH, USER_ID
      )
      expect(result.newCategoryRules).toHaveLength(0)
    })

    it('NÃO deve duplicar sugestão de nova regra se já existir', () => {
      const catRules = [makeCatRule({ keyword: 'spotify', category: 'Musica' })]
      const result = useCase.execute(
        [makeParsed({ description: 'Spotify Premium', category: 'Assinaturas' })],
        [], [], catRules, MONTH, USER_ID
      )
      // A regra já existe, então não deve sugerir outra
      expect(result.newCategoryRules).toHaveLength(0)
    })
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Cenários integrados (combinando vários recursos)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('cenários integrados', () => {
    it('deve processar fatura completa com duplicatas, regras e categorias', () => {
      const existing = [
        makeExisting({ id: 'exp-1', description: 'Uber Trip', amount: 25.50 }),
      ]
      const rules: AssignmentRuleWithPerson[] = [
        makeRule({ keyword: 'ifood', personId: 'person-dayse', person: {
          id: 'person-dayse', name: 'Dayse', linkedUserId: 'user-456', linkStatus: 'ACCEPTED'
        }}),
        makeRule({ keyword: 'petz', personId: 'person-diogenes', person: {
          id: 'person-diogenes', name: 'Diógenes', linkedUserId: null, linkStatus: 'NONE'
        }}),
      ]
      const catRules = [
        makeCatRule({ keyword: 'ifood', category: 'Alimentação' }),
      ]

      const transactions = [
        makeParsed({ description: 'Uber Trip', amount: 25.50 }),           // DUPLICATA
        makeParsed({ description: 'iFood Pedido', amount: 45.90, date: '2026-06-16' }), // Auto-atribuída + PENDING
        makeParsed({ description: 'Petz Ração', amount: 89.90, date: '2026-06-17' }),   // Auto-atribuída + ACCEPTED (local)
        makeParsed({ description: 'Netflix', amount: 55.90, date: '2026-06-18' }),       // Sem regra
      ]

      const result = useCase.execute(transactions, existing, rules, catRules, MONTH, USER_ID)

      // 1 duplicata ignorada, 3 novas
      expect(result.skippedDuplicates).toBe(1)
      expect(result.expenses).toHaveLength(3)
      expect(result.autoAssigned).toBe(2) // ifood + petz

      // iFood -> Dayse (vinculada) -> PENDING
      const ifoodExp = result.expenses.find(e => e.description === 'iFood Pedido')!
      expect(ifoodExp.personId).toBe('person-dayse')
      expect(ifoodExp.sharedStatus).toBe('PENDING')
      expect(ifoodExp.category).toBe('Alimentação')

      // Petz -> Diógenes (local) -> ACCEPTED
      const petzExp = result.expenses.find(e => e.description === 'Petz Ração')!
      expect(petzExp.personId).toBe('person-diogenes')
      expect(petzExp.sharedStatus).toBe('ACCEPTED')

      // Netflix -> sem regra -> personId null, ACCEPTED
      const netflixExp = result.expenses.find(e => e.description === 'Netflix')!
      expect(netflixExp.personId).toBeNull()
      expect(netflixExp.sharedStatus).toBe('ACCEPTED')
    })

    it('deve reimportar a mesma fatura sem criar duplicatas', () => {
      // Simula: usuário importou a fatura, obteve 3 despesas.
      // Agora importa de novo. Todas devem ser ignoradas.
      const existing = [
        makeExisting({ id: 'e1', description: 'Uber Trip', amount: 25.50 }),
        makeExisting({ id: 'e2', description: 'iFood', amount: 45.90, date: new Date('2026-06-16') }),
        makeExisting({ id: 'e3', description: 'Netflix', amount: 55.90, date: new Date('2026-06-18') }),
      ]
      const parsed = [
        makeParsed({ description: 'Uber Trip', amount: 25.50 }),
        makeParsed({ description: 'iFood', amount: 45.90, date: '2026-06-16' }),
        makeParsed({ description: 'Netflix', amount: 55.90, date: '2026-06-18' }),
      ]

      const result = useCase.execute(parsed, existing, [], [], MONTH, USER_ID)
      expect(result.expenses).toHaveLength(0)
      expect(result.skippedDuplicates).toBe(3)
    })
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Categorização automática via CategoryRule
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('categorização automática (CategoryRule)', () => {
    it('deve aplicar a categoria da regra quando a keyword bater na descrição', () => {
      const catRules = [makeCatRule({ keyword: 'ifood', category: 'Alimentação' })]
      const parsed = [makeParsed({ description: 'iFood Pedido #123', category: 'Outros' })]

      const result = useCase.execute(parsed, [], [], catRules, MONTH, USER_ID)
      expect(result.expenses).toHaveLength(1)
      expect(result.expenses[0].category).toBe('Alimentação')
    })

    it('deve dar prioridade à CategoryRule sobre a sugestão da IA', () => {
      // IA sugeriu "Lazer", mas a regra do usuário diz "Transporte"
      const catRules = [makeCatRule({ keyword: 'uber', category: 'Transporte' })]
      const parsed = [makeParsed({ description: 'Uber Trip', category: 'Lazer' })]

      const result = useCase.execute(parsed, [], [], catRules, MONTH, USER_ID)
      expect(result.expenses[0].category).toBe('Transporte')
    })

    it('deve usar a categoria da IA como fallback quando não há regra', () => {
      const parsed = [makeParsed({ description: 'Spotify Premium', category: 'Assinaturas' })]

      const result = useCase.execute(parsed, [], [], [], MONTH, USER_ID)
      expect(result.expenses[0].category).toBe('Assinaturas')
    })

    it('deve usar "Outros" quando não há regra nem sugestão da IA', () => {
      const parsed = [makeParsed({ description: 'Compra aleatória', category: '' })]

      const result = useCase.execute(parsed, [], [], [], MONTH, USER_ID)
      expect(result.expenses[0].category).toBe('Outros')
    })

    it('deve gerar newCategoryRules quando a IA sugere categoria e não existe regra', () => {
      const parsed = [makeParsed({ description: 'Farmacia Popular', category: 'Saúde' })]

      const result = useCase.execute(parsed, [], [], [], MONTH, USER_ID)
      expect(result.newCategoryRules).toHaveLength(1)
      expect(result.newCategoryRules[0]).toEqual({
        keyword: 'farmacia',
        category: 'Saúde',
      })
    })

    it('NÃO deve gerar nova regra se a keyword for curta demais (≤2 chars)', () => {
      const parsed = [makeParsed({ description: 'Me Alimentação', category: 'Alimentação' })]

      const result = useCase.execute(parsed, [], [], [], MONTH, USER_ID)
      // "me" tem apenas 2 caracteres, não deve criar regra
      expect(result.newCategoryRules).toHaveLength(0)
    })

    it('NÃO deve gerar nova regra se a keyword já existir nas regras ativas', () => {
      const catRules = [makeCatRule({ keyword: 'farmacia', category: 'Saúde' })]
      const parsed = [makeParsed({ description: 'Farmacia São Paulo', category: 'Saúde' })]

      const result = useCase.execute(parsed, [], [], catRules, MONTH, USER_ID)
      // A regra já existe, não deve duplicar
      expect(result.newCategoryRules).toHaveLength(0)
    })

    it('NÃO deve gerar nova regra quando a IA sugere "Outros"', () => {
      const parsed = [makeParsed({ description: 'Compra aleatória', category: 'Outros' })]

      const result = useCase.execute(parsed, [], [], [], MONTH, USER_ID)
      expect(result.newCategoryRules).toHaveLength(0)
    })

    it('deve acumular regras ativas entre transações do mesmo lote', () => {
      // Duas transações: a primeira gera a regra "farmacia" → Saúde.
      // A segunda também começa com "farmacia" mas NÃO deve gerar duplicata.
      const parsed = [
        makeParsed({ description: 'Farmacia Popular', category: 'Saúde', date: '2026-06-10' }),
        makeParsed({ description: 'Farmacia SP', category: 'Saúde', date: '2026-06-11', amount: 30 }),
      ]

      const result = useCase.execute(parsed, [], [], [], MONTH, USER_ID)
      // Apenas 1 nova regra deve ser gerada (da primeira transação)
      expect(result.newCategoryRules).toHaveLength(1)
      // A segunda transação deve usar a regra recém-criada
      expect(result.expenses[1].category).toBe('Saúde')
    })

    it('deve funcionar com regras de categoria e regras de atribuição combinadas', () => {
      const catRules = [makeCatRule({ keyword: 'uber', category: 'Transporte' })]
      const assignmentRules = [makeRule({ keyword: 'uber', personId: 'person-dayse' })]
      const parsed = [makeParsed({ description: 'Uber Trip', category: 'Lazer' })]

      const result = useCase.execute(parsed, [], assignmentRules, catRules, MONTH, USER_ID)
      expect(result.expenses[0].category).toBe('Transporte')
      expect(result.expenses[0].personId).toBe('person-dayse')
      expect(result.autoAssigned).toBe(1)
    })
  })
})
