import { ExpenseRepository } from '../domain/ports/ExpenseRepository';
import { PersonRepository } from '../domain/ports/PersonRepository';
import { NotificationRepository } from '../domain/ports/NotificationRepository';
import { PaymentStatusRepository } from '../domain/ports/PaymentStatusRepository';
import { CategoryRuleRepository } from '../domain/ports/CategoryRuleRepository';
import { Expense } from '../domain/entities/Expense';
import { resolveSharedStatusFromPerson } from '../domain/services/SharedStatusService';
import { NotificationService } from '../domain/services/NotificationService';
import { InstallmentService } from '../domain/services/InstallmentService';

export interface UpdateExpenseInput {
  description: string;
  amount: number;
  category?: string | null;
  card?: string | null;
  date?: string;
  month?: string;
}

export class UpdateExpense {
  constructor(
    private expenseRepo: ExpenseRepository,
    private personRepo: PersonRepository,
    private notificationRepo: NotificationRepository,
    private statusRepo: PaymentStatusRepository,
    private categoryRuleRepo: CategoryRuleRepository
  ) {}

  async executePatch(id: string, userId: string, userName: string, data: {
    personId?: string | null;
    month?: string;
    isPaid?: boolean;
  }): Promise<Expense> {
    const expense = await this.expenseRepo.findById(id);
    if (!expense || expense.userId !== userId) {
      throw new Error('Despesa não encontrada');
    }

    const { personId, month, isPaid } = data;

    if (personId !== undefined) {
      let sharedStatus = 'ACCEPTED';
      if (personId !== null) {
        const p = await this.personRepo.findById(personId);
        sharedStatus = resolveSharedStatusFromPerson(p);
      }
      await this.expenseRepo.updatePerson(id, personId, sharedStatus);
      expense.personId = personId;

      // Cascade updates
      if (expense.originalDescription) {
        this.cascadeInstallmentUpdates(userId, {
          ...expense,
          personId,
          sharedStatus
        }, {
          personId,
          sharedStatus
        }).catch(err => console.error('[Cascade error background]:', err));
      }
    }

    if (month !== undefined) {
      await this.expenseRepo.updateMonth(id, month);
      expense.month = month;
    }

    if (isPaid !== undefined) {
      await this.expenseRepo.updatePaid(id, isPaid);
      expense.isPaid = isPaid;

      if (isPaid) {
        const expenseWithPerson = await this.expenseRepo.findById(id);
        if (expenseWithPerson && expenseWithPerson.personId) {
          const person = await this.personRepo.findById(expenseWithPerson.personId);
          if (person && person.linkedUserId && person.linkedUserId !== userId) {
            await NotificationService.notifyExpensePaid(
              this.notificationRepo,
              expenseWithPerson.description,
              userName,
              person.linkedUserId
            );
          }
        }
      }

      // Check monthly payment status
      const currentExpense = await this.expenseRepo.findById(id);
      if (currentExpense && currentExpense.personId && currentExpense.month) {
        const pid = currentExpense.personId;
        const m = currentExpense.month;

        const personExpenses = await this.expenseRepo.findByPersonAndMonth(userId, pid, m);
        if (personExpenses.length > 0) {
          const allPaid = personExpenses.every(e => e.isPaid);
          await this.statusRepo.upsert(pid, m, allPaid);
        }
      }
    }

    return expense;
  }

  async executePut(id: string, userId: string, data: UpdateExpenseInput): Promise<Expense> {
    const expense = await this.expenseRepo.findById(id);
    if (!expense || expense.userId !== userId) {
      throw new Error('Despesa não encontrada');
    }

    const { description, amount, category, card, date, month } = data;

    if (expense.isManual && !description) {
      throw new Error('Descrição é obrigatória para gastos manuais');
    }
    if (typeof amount !== 'number') {
      throw new Error('Valor inválido');
    }

    const updates: any = {};

    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Data inválida');
      }
      updates.date = parsedDate;
      if (!month) {
        const matchedMonth = date.match(/^\d{4}-\d{2}/);
        updates.month = matchedMonth ? matchedMonth[0] : parsedDate.toISOString().substring(0, 7);
      }
    }

    if (month) {
      updates.month = month;
    }

    // Save original values if not set yet
    if (expense.originalDescription === null) {
      updates.originalDescription = expense.description;
    }
    if (expense.originalAmount === null) {
      updates.originalAmount = expense.amount;
    }

    if (!expense.isManual) {
      const baseName = expense.originalDescription || expense.description;
      if (description && description.trim().length > 0) {
        updates.description = `${baseName} (${description.trim()})`;
      } else {
        updates.description = baseName;
      }
    } else {
      updates.description = description.trim();
    }

    updates.amount = amount;

    // Category update
    if (category !== undefined) {
      updates.category = category || null;
    } else {
      if (updates.description) {
        const categoryRules = await this.categoryRuleRepo.findByUserId(userId);
        const descLower = updates.description.toLowerCase();
        const matchedCategoryRule = categoryRules.find(r =>
          descLower.includes(r.keyword.toLowerCase())
        );
        if (matchedCategoryRule) {
          updates.category = matchedCategoryRule.category;
        }
      }
    }

    if (expense.isManual && card !== undefined) {
      updates.card = card || null;
    }

    const pid = expense.personId;
    const oldMonth = expense.month;
    const newMonth = updates.month || oldMonth;
    const oldDescription = expense.description;

    const updatedExpense = await this.expenseRepo.save({
      ...expense,
      ...updates
    });

    if (updates.description && oldDescription !== updates.description) {
      await this.notificationRepo.updateMessagesContaining(oldDescription, updates.description);
    }

    // Cascade update to siblings
    const baseOrigDesc = updatedExpense.originalDescription || expense.originalDescription;
    if (baseOrigDesc) {
      const cascadeUpdates: any = {};
      if (category !== undefined) {
        cascadeUpdates.category = category || null;
      }
      if (description !== undefined) {
        cascadeUpdates.description = description.trim();
      }

      if (Object.keys(cascadeUpdates).length > 0) {
        this.cascadeInstallmentUpdates(userId, {
          ...updatedExpense,
          originalDescription: baseOrigDesc
        }, cascadeUpdates).catch(err => console.error('[Cascade error PUT background]:', err));
      }
    }

    if (pid && (oldMonth !== newMonth)) {
      const oldMonthExpenses = await this.expenseRepo.findByPersonAndMonth(userId, pid, oldMonth);
      if (oldMonthExpenses.length > 0) {
        const oldAllPaid = oldMonthExpenses.every(e => e.isPaid);
        await this.statusRepo.upsert(pid, oldMonth, oldAllPaid);
      } else {
        await this.statusRepo.deleteByPersonAndMonth(pid, oldMonth);
      }

      const newMonthExpenses = await this.expenseRepo.findByPersonAndMonth(userId, pid, newMonth);
      if (newMonthExpenses.length > 0) {
        const newAllPaid = newMonthExpenses.every(e => e.isPaid);
        await this.statusRepo.upsert(pid, newMonth, newAllPaid);
      }
    }

    return updatedExpense;
  }

  private async cascadeInstallmentUpdates(
    userId: string,
    mainExpense: Expense,
    updates: {
      description?: string;
      category?: string | null;
      personId?: string | null;
      sharedStatus?: string;
    }
  ) {
    try {
      const { originalDescription, amount, card, month, date, id: mainId } = mainExpense;
      if (!originalDescription) return;

      const installment = InstallmentService.parseInstallment(originalDescription);
      if (!installment) return;

      const { current, total, matchedText, originalRoot } = installment;

      const siblings = await this.expenseRepo.findInstallmentSiblings(userId, mainId, card, amount);

      const existingSiblings = siblings.filter(sib => {
        const sibDesc = sib.originalDescription || sib.description;
        const sibInstallment = InstallmentService.parseInstallment(sibDesc);
        if (!sibInstallment || sibInstallment.total !== total) return false;
        if (sibInstallment.originalRoot.toLowerCase() !== originalRoot.toLowerCase()) return false;

        const diffMonths = sibInstallment.current - current;
        const expectedMonth = InstallmentService.addMonthsToMonthString(month, diffMonths);
        return sib.month === expectedMonth;
      });

      const activePersonId = updates.personId !== undefined ? updates.personId : mainExpense.personId;
      const activeCategory = updates.category !== undefined ? updates.category : mainExpense.category;
      const activeSharedStatus = updates.sharedStatus !== undefined ? updates.sharedStatus : mainExpense.sharedStatus;

      if (activePersonId !== null) {
        const newExpensesData: any[] = [];

        for (let i = 1; i <= total; i++) {
          if (i === current) continue;

          const alreadyExists = existingSiblings.some(sib => {
            const sibDesc = sib.originalDescription || sib.description;
            const sibInstallment = InstallmentService.parseInstallment(sibDesc);
            return sibInstallment?.current === i;
          });

          if (!alreadyExists) {
            const diffMonths = i - current;
            const installmentDate = new Date(date);
            installmentDate.setMonth(installmentDate.getMonth() + diffMonths);

            const installmentMonth = InstallmentService.addMonthsToMonthString(month, diffMonths);
            const installmentDesc = InstallmentService.generateDescription(
              originalDescription,
              matchedText,
              i
            );

            let friendlyDesc = '';
            if (updates.description) {
              friendlyDesc = InstallmentService.cleanInstallmentText(updates.description);
            } else {
              const parenMatch = mainExpense.description.match(/\(([^)]+)\)/);
              if (parenMatch) {
                friendlyDesc = parenMatch[1].trim();
              }
            }

            const finalDesc = friendlyDesc
              ? `${installmentDesc} (${friendlyDesc})`
              : installmentDesc;

            newExpensesData.push({
              userId,
              date: installmentDate,
              description: finalDesc,
              amount,
              originalAmount: amount,
              card,
              isManual: false,
              month: installmentMonth,
              personId: activePersonId,
              category: activeCategory,
              sharedStatus: activeSharedStatus,
              originalDescription: installmentDesc,
            });
          }
        }

        if (newExpensesData.length > 0) {
          await this.expenseRepo.saveMany(newExpensesData);
        }
      }

      const updatePromises = existingSiblings.map(async sib => {
        const sibUpdates: any = {};

        if (updates.category !== undefined) {
          sibUpdates.category = updates.category;
        }

        if (updates.personId !== undefined) {
          sibUpdates.personId = updates.personId;
          sibUpdates.sharedStatus = updates.sharedStatus || 'ACCEPTED';
        }

        if (updates.description !== undefined) {
          const sibDesc = sib.originalDescription || sib.description;
          const sibInstallment = InstallmentService.parseInstallment(sibDesc);

          if (sibInstallment) {
            const newBaseDesc = InstallmentService.cleanInstallmentText(updates.description);
            const oldSibDesc = sib.description;
            let newSibDesc = '';

            if (!sib.isManual) {
              newSibDesc = `${sibDesc} (${newBaseDesc})`;
            } else {
              const replacedMatchedText = sibInstallment.matchedText.replace(/\d+/, String(sibInstallment.current));
              newSibDesc = `${newBaseDesc} ${replacedMatchedText}`;
            }

            if (oldSibDesc !== newSibDesc) {
              sibUpdates.description = newSibDesc;
              await this.notificationRepo.updateMessagesContaining(oldSibDesc, newSibDesc);
            }
          }
        }

        if (Object.keys(sibUpdates).length > 0) {
          await this.expenseRepo.save({
            ...sib,
            ...sibUpdates
          });
        }
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('[cascadeInstallmentUpdates error]:', error);
    }
  }
}
