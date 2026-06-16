import { UserRepository } from '../domain/ports/UserRepository'
import { User } from '../domain/entities/User'

export class ManageUsersUseCase {
  constructor(private userRepo: UserRepository) {}

  async listAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.userRepo.findAll()
    return users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      forcePasswordReset: u.forcePasswordReset,
      phone: u.phone,
      avatar: u.avatar,
      createdAt: u.createdAt,
    }))
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepo.delete(id)
  }
}
