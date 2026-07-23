import { PersonRepository } from '../domain/ports/PersonRepository';
import { Person } from '../domain/entities/Person';

export class GetPendingInvites {
  constructor(private personRepo: PersonRepository) {}

  async execute(email: string, userId: string): Promise<Person[]> {
    return this.personRepo.findPendingInvites(email, userId);
  }
}
