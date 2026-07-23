import { AssignmentRuleRepository } from '../domain/ports/AssignmentRuleRepository';
import { CategoryRuleRepository } from '../domain/ports/CategoryRuleRepository';
import { ExpenseRepository } from '../domain/ports/ExpenseRepository';
import { ProcessInvoice } from './ProcessInvoice';
import { GeminiParserService } from '@/adapters/ai/GeminiParserService';
import { IntegrationLogger } from '../domain/services/IntegrationLogger';

export class UploadInvoice {
  constructor(
    private ruleRepo: AssignmentRuleRepository,
    private categoryRuleRepo: CategoryRuleRepository,
    private expenseRepo: ExpenseRepository,
    private processInvoice: ProcessInvoice
  ) {}

  async execute(userId: string, data: {
    text: string;
    month: string;
    isCsv: boolean;
    buffer?: Buffer;
  }) {
    const { text, month, isCsv, buffer } = data;
    const geminiParser = new GeminiParserService();

    let parsedExpenses: any[] = [];
    let resolvedMonth = month;

    const parseResult = await IntegrationLogger.run({
      serviceName: 'Gemini',
      operation: 'parseInvoiceText',
      userId,
      requestData: { textLength: text.length, referenceMonth: month }
    }, async () => {
      return await geminiParser.parseInvoiceText(text, month, isCsv ? undefined : buffer);
    });
    parsedExpenses = parseResult.transactions;
    resolvedMonth = parseResult.resolvedMonth || month;

    const rules = await this.ruleRepo.findByUser(userId);
    const categoryRules = await this.categoryRuleRepo.findByUserId(userId);
    const existingExpenses = await this.expenseRepo.findByUserAndMonth(userId, resolvedMonth);

    const result = this.processInvoice.execute(
      parsedExpenses,
      existingExpenses,
      rules as any,
      categoryRules,
      resolvedMonth,
      userId
    );

    for (const newRule of result.newCategoryRules) {
      try {
        await this.categoryRuleRepo.create(
          newRule.keyword,
          newRule.category,
          userId
        );
      } catch (e) {}
    }

    if (result.expenses.length > 0) {
      await this.expenseRepo.saveMany(result.expenses);
    }

    return {
      expensesCount: result.expenses.length,
      autoAssigned: result.autoAssigned,
      month: resolvedMonth,
      skippedDuplicates: result.skippedDuplicates
    };
  }
}
