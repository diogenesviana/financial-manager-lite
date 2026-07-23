import { PersonRepository } from '../domain/ports/PersonRepository';
import { ExpenseRepository } from '../domain/ports/ExpenseRepository';

export class DeletePerson {
  constructor(
    private personRepo: PersonRepository,
    private expenseRepo: ExpenseRepository
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const person = await this.personRepo.findById(id);
    if (!person || person.userId !== userId) {
      throw new Error('Pessoa não encontrada');
    }

    if (person.linkedUserId === userId && person.userId === userId) {
      throw new Error('Você não pode excluir o seu próprio integrante.');
    }

    await this.expenseRepo.updateManyPerson(userId, id, null);
    await this.personRepo.delete(id);
  }
}
