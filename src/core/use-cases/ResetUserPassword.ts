import { UserRepository } from '../domain/ports/UserRepository';
import { PasswordHasher } from '../domain/ports/PasswordHasher';
import crypto from 'crypto';

export class ResetUserPassword {
  constructor(
    private userRepo: UserRepository,
    private hasher: PasswordHasher
  ) {}

  async execute(targetUserId: string): Promise<string> {
    const user = await this.userRepo.findById(targetUserId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const randomHex = crypto.randomBytes(4).toString('hex');
    const specialChars = ['@', '$', '!', '%', '*', '?', '&'];
    const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
    const newPassword = `Temp${randomHex}${randomSpecial}1`;

    const passwordHash = await this.hasher.hash(newPassword);
    user.passwordHash = passwordHash;
    user.forcePasswordReset = true;

    await this.userRepo.save(user);

    return newPassword;
  }
}
