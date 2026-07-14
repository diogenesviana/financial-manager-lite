import { Person } from '../entities/Person'

export interface PersonRepository {
  findById(id: string): Promise<Person | null>
  findByUser(userId: string): Promise<Person[]>
  save(person: Omit<Person, 'id' | 'createdAt'> & { id?: string }): Promise<Person>
  delete(id: string): Promise<void>
  updateLinkedAvatarAndPhone(linkedUserId: string, avatar: string | null, phone: string | null): Promise<void>
}
