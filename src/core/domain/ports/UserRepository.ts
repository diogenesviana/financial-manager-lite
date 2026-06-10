import { User } from '../entities/User'

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: Omit<User, 'id' | 'createdAt'> & { id?: string }): Promise<User>
  delete(id: string): Promise<void>
  findAll(): Promise<User[]>
}
