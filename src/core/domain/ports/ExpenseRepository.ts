import { Expense } from '../entities/Expense'

export interface SearchOptions {
  page: number
  limit: number
  search?: string
  month?: string
  personId?: string
  category?: string
  isPaid?: string
  source?: string
  sortBy?: string
  sortDir?: string
}

export interface ExpenseRepository {
  findById(id: string): Promise<Expense | null>
  findByUserAndMonth(userId: string, month: string): Promise<Expense[]>
  findByPersonAndMonth(userId: string, personId: string | null, month: string): Promise<Expense[]>
  findDuplicate(userId: string, expense: Omit<Expense, 'id' | 'createdAt' | 'userId' | 'personId'>): Promise<Expense | null>
  save(expense: Omit<Expense, 'id' | 'createdAt'> & { id?: string }): Promise<Expense>
  saveMany(expenses: Omit<Expense, 'id' | 'createdAt'>[]): Promise<void>
  delete(id: string): Promise<void>
  clearAllByUser(userId: string): Promise<void>
  clearExpenses(userId: string, type: 'unassigned' | 'assigned' | 'all'): Promise<void>
  findAll(): Promise<Expense[]>
  findMonthsByUser(userId: string): Promise<string[]>
  findSharedExpenses(userId: string): Promise<Expense[]>
  findRecentDescriptions(userId: string, limit: number): Promise<string[]>
  unassignAll(userId: string): Promise<void>
  updatePerson(id: string, personId: string | null, sharedStatus?: string): Promise<void>
  updateManyPerson(userId: string, fromPersonId: string, toPersonId: string | null): Promise<void>
  updateMonth(id: string, month: string): Promise<void>
  updatePaid(id: string, isPaid: boolean): Promise<void>
  updateManyPaid(userId: string, personId: string, month: string, isPaid: boolean): Promise<void>
  findInstallmentSiblings(userId: string, mainExpenseId: string, card: string | null, amount: number): Promise<Expense[]>
  search(userId: string, options: SearchOptions): Promise<{ expenses: Expense[]; total: number; totalAmount: number }>
}
