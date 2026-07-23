import { UserRepository } from '../domain/ports/UserRepository';
import { PasswordHasher } from '../domain/ports/PasswordHasher';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export class ChangePassword {
  constructor(
    private userRepo: UserRepository,
    private hasher: PasswordHasher
  ) {}

  async execute(userId: string, newPassword: string): Promise<void> {
    if (!newPassword || !passwordRegex.test(newPassword)) {
      throw new Error('A senha deve ter no mínimo 8 caracteres, contendo pelo menos 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const passwordHash = await this.hasher.hash(newPassword);
    user.passwordHash = passwordHash;
    user.forcePasswordReset = false;

    await this.userRepo.save(user);
  }
}
