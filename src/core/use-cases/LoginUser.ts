import { UserRepository } from '../domain/ports/UserRepository'
import { PasswordHasher } from '../domain/ports/PasswordHasher'
import { TokenService } from '../domain/ports/TokenService'

export class LoginUserUseCase {
  constructor(
    private userRepo: UserRepository,
    private hasher: PasswordHasher,
    private tokenService: TokenService
  ) {}

  async execute(email: string, password: string, rememberMe: boolean = false) {
    const user = await this.userRepo.findByEmail(email)
    if (!user) {
      throw new Error('Credenciais inválidas')
    }

    const matches = await this.hasher.compare(password, user.passwordHash)
    if (!matches) {
      throw new Error('Credenciais inválidas')
    }

    // Gerar token JWT
    // Se rememberMe for true, validade de 7 dias, senão 24 horas (em segundos)
    const expiresIn = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60
    const token = await this.tokenService.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      expiresIn
    )

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        forcePasswordReset: user.forcePasswordReset,
      },
      expiresIn,
    }
  }
}
