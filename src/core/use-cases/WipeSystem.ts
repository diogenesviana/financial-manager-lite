import { ExpenseRepository } from '../domain/ports/ExpenseRepository';
import { AssignmentRuleRepository } from '../domain/ports/AssignmentRuleRepository';
import { PersonRepository } from '../domain/ports/PersonRepository';
import { UserRepository } from '../domain/ports/UserRepository';

export class WipeSystem {
  constructor(
    private expenseRepo: ExpenseRepository,
    private ruleRepo: AssignmentRuleRepository,
    private personRepo: PersonRepository,
    private userRepo: UserRepository
  ) {}

  async execute(adminUserId: string): Promise<void> {
    await this.expenseRepo.clearExpenses(adminUserId, 'all');
    await this.ruleRepo.clearAllByUser(adminUserId);
    await this.personRepo.clearAllByUser(adminUserId);
    await this.userRepo.deleteAllExcept(adminUserId);
  }
}
