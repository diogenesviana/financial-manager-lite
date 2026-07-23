import { UserRepository } from '../domain/ports/UserRepository';
import { PersonRepository } from '../domain/ports/PersonRepository';

export class LookupUserForInvite {
  constructor(
    private userRepo: UserRepository,
    private personRepo: PersonRepository
  ) {}

  async execute(email: string, currentUser: { id: string; email: string }) {
    if (email === currentUser.email.toLowerCase()) {
      throw new Error('Não é possível convidar a si mesmo');
    }

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      return { found: false };
    }

    const people = await this.personRepo.findByUser(currentUser.id);
    const existingPerson = people.find(p => p.linkedUserId === user.id && p.linkStatus !== 'REJECTED');

    return {
      found: true,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        email: user.email,
      },
      alreadyLinked: !!existingPerson
    };
  }
}
