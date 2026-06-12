import { Expense } from '../entities/Expense'

export interface ExpenseRepository {
  findById(id: string): Promise<Expense | null>
  findByUserAndMonth(userId: string, month: string): Promise<Expense[]>
  findDuplicate(userId: string, expense: Omit<Expense, 'id' | 'createdAt' | 'userId' | 'personId'>): Promise<Expense | null>
  save(expense: Omit<Expense, 'id' | 'createdAt'> & { id?: string }): Promise<Expense>
  saveMany(expenses: Omit<Expense, 'id' | 'createdAt'>[]): Promise<void>
  delete(id: string): Promise<void>
  clearAllByUser(userId: string): Promise<void>
  updatePerson(id: string, personId: string | null): Promise<void>
  updateManyPerson(userId: string, fromPersonId: string, toPersonId: string | null): Promise<void>
  updateMonth(id: string, month: string): Promise<void>
}
