import { UserRepository } from '../domain/ports/UserRepository';
import { User } from '../domain/entities/User';

export class GetSessionProfile {
  constructor(private userRepo: UserRepository) {}

  async execute(userId: string): Promise<Omit<User, 'passwordHash' | 'lastLogin'> | null> {
    const dbUser = await this.userRepo.findById(userId);
    if (!dbUser) {
      return null;
    }

    const now = new Date();
    const fifteenMinutes = 15 * 60 * 1000;
    const needsUpdate = !dbUser.lastLogin || (now.getTime() - new Date(dbUser.lastLogin).getTime() > fifteenMinutes);

    if (needsUpdate) {
      await this.userRepo.updateLastLogin(dbUser.id, now);
    }

    const { passwordHash, lastLogin, ...userResponse } = dbUser;
    return userResponse;
  }
}
