import { ExpenseRepository } from '../domain/ports/ExpenseRepository';
import { PersonRepository } from '../domain/ports/PersonRepository';
import { AssignmentRuleRepository } from '../domain/ports/AssignmentRuleRepository';

export class ClearUserData {
  constructor(
    private expenseRepo: ExpenseRepository,
    private personRepo: PersonRepository,
    private ruleRepo: AssignmentRuleRepository
  ) {}

  async execute(userId: string, type: string = 'all_expenses'): Promise<void> {
    if (type === 'unassign_all') {
      await this.expenseRepo.unassignAll(userId);
    } else if (type === 'all_expenses') {
      await this.expenseRepo.clearAllByUser(userId);
    } else if (type === 'all_people') {
      await this.personRepo.clearAllByUser(userId);
    } else if (type === 'all_rules') {
      await this.ruleRepo.clearAllByUser(userId);
    } else if (type === 'reset_all') {
      await this.expenseRepo.clearAllByUser(userId);
      await this.ruleRepo.clearAllByUser(userId);
      await this.personRepo.clearAllByUser(userId);
    }
  }
}
