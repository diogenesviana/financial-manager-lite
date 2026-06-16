import { UserRepository } from '../domain/ports/UserRepository'
import { PasswordHasher } from '../domain/ports/PasswordHasher'
import { User } from '../domain/entities/User'

export class RegisterUserUseCase {
  constructor(
    private userRepo: UserRepository,
    private hasher: PasswordHasher
  ) {}

  async execute(data: { name: string; email: string; passwordHash: string; role?: 'USER' | 'ADMIN'; forcePasswordReset?: boolean }): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.userRepo.findByEmail(data.email)
    if (existing) {
      throw new Error('E-mail já cadastrado')
    }

    const hashedPassword = await this.hasher.hash(data.passwordHash)

    const saved = await this.userRepo.save({
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
      role: data.role || 'USER',
      forcePasswordReset: data.forcePasswordReset ?? false,
    })

    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      forcePasswordReset: saved.forcePasswordReset,
      createdAt: saved.createdAt,
    }
  }
}
