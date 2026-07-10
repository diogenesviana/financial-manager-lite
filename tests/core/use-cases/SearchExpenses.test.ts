import { SearchExpensesUseCase } from '@/core/use-cases/SearchExpenses'
import { ExpenseRepository, SearchOptions } from '@/core/domain/ports/ExpenseRepository'
import { Expense } from '@/core/domain/entities/Expense'

describe('SearchExpensesUseCase', () => {
  let mockExpenseRepository: jest.Mocked<ExpenseRepository>
  let useCase: SearchExpensesUseCase

  beforeEach(() => {
    mockExpenseRepository = {
      findById: jest.fn(),
      findByUserAndMonth: jest.fn(),
      findDuplicate: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      delete: jest.fn(),
      clearAllByUser: jest.fn(),
      updatePerson: jest.fn(),
      updateManyPerson: jest.fn(),
      updateMonth: jest.fn(),
      updatePaid: jest.fn(),
      updateManyPaid: jest.fn(),
      search: jest.fn()
    } as any

    useCase = new SearchExpensesUseCase(mockExpenseRepository)
  })

  it('deve chamar o repositório com os parâmetros corretos', async () => {
    const userId = 'user-123'
    const options: SearchOptions = {
      page: 1,
      limit: 20,
      search: 'Uber',
      month: '2026-07'
    }

    const mockResponse = {
      expenses: [
        {
          id: '1',
          date: new Date(),
          description: 'Uber Ride',
          amount: 25.5,
          personId: null,
          month: '2026-07',
          userId,
          sharedStatus: 'ACCEPTED',
          isPaid: false
        } as any
      ],
      total: 1
    }

    mockExpenseRepository.search.mockResolvedValue(mockResponse)

    const result = await useCase.execute(userId, options)

    expect(mockExpenseRepository.search).toHaveBeenCalledWith(userId, options)
    expect(result).toEqual(mockResponse)
  })

  it('deve lançar erro se o userId não for fornecido', async () => {
    const options: SearchOptions = { page: 1, limit: 20 }

    await expect(useCase.execute('', options)).rejects.toThrow('UserId é obrigatório')
  })
})
