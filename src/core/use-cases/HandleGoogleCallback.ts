import { UserRepository } from '../domain/ports/UserRepository';
import { PersonRepository } from '../domain/ports/PersonRepository';
import { TokenService } from '../domain/ports/TokenService';

export interface GoogleCallbackResult {
  token: string;
  email: string;
}

export class HandleGoogleCallback {
  constructor(
    private userRepo: UserRepository,
    private personRepo: PersonRepository,
    private tokenService: TokenService
  ) {}

  async execute(email: string, googlePicture: string | null): Promise<GoogleCallbackResult> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error('unregistered');
    }

    const storedAvatar = user.avatar;
    const isGoogleUrl = !!(storedAvatar && storedAvatar.startsWith('http') && storedAvatar.includes('googleusercontent.com'));
    const isMissing = !storedAvatar || storedAvatar.trim() === '' || storedAvatar === 'null';

    user.lastLogin = new Date();
    if (googlePicture && (isMissing || isGoogleUrl)) {
      user.avatar = googlePicture;
    }

    await this.userRepo.save(user);

    if (googlePicture && (isMissing || isGoogleUrl)) {
      await this.personRepo.updateLinkedAvatarAndPhone(user.id, googlePicture, null);
    }

    const expiresIn = 7 * 24 * 60 * 60; // 7 days
    const token = await this.tokenService.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      expiresIn
    );

    return { token, email: user.email };
  }
}
