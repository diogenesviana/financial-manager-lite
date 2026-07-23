import { jest } from '@jest/globals';
import './regression-helper';
import { GET as getExpenses, POST as postExpense } from '@/app/api/expenses/route';
import { POST as clearExpenses } from '@/app/api/expenses/clear/route';
import { GET as getSuggestions } from '@/app/api/expenses/suggestions/route';
import { GET as getRules, POST as postRule } from '@/app/api/rules/route';
import { GET as getCategoryRules, POST as postCategoryRule } from '@/app/api/category-rules/route';
import { mockPrisma } from './regression-helper';

describe('Expenses & Rules Regression Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Expenses API', () => {
    it('should list user expenses', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([
        { id: 'exp-1', description: 'Mercado', amount: 150.0, date: new Date(), month: '2026-07', userId: 'test-user-id' }
      ]);

      const res = await getExpenses(new Request('http://localhost/api/expenses'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].description).toBe('Mercado');
    });

    it('should create an expense', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(null); // No duplicates
      mockPrisma.expense.create.mockResolvedValue({
        id: 'exp-2',
        description: 'Combustível',
        amount: 80.0,
        date: new Date(),
        month: '2026-07',
        userId: 'test-user-id'
      });
      mockPrisma.categoryRule.findMany.mockResolvedValue([]);

      const req = new Request('http://localhost/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Combustível',
          amount: 80.0,
          date: '2026-07-23',
          month: '2026-07'
        })
      });

      const res = await postExpense(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.description).toBe('Combustível');
    });
  });

  describe('Clear Expenses API', () => {
    it('should clear expenses', async () => {
      mockPrisma.expense.deleteMany.mockResolvedValue({ count: 5 });

      const req = new Request('http://localhost/api/expenses/clear', {
        method: 'POST',
        body: JSON.stringify({ type: 'all' })
      });

      const res = await clearExpenses(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Suggestions API', () => {
    it('should return recent unique suggestions', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([
        { description: 'Padaria' },
        { description: 'Padaria ' },
        { description: 'Supermercado' }
      ]);

      const res = await getSuggestions();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(['Padaria', 'Supermercado']);
    });
  });

  describe('Assignment Rules API', () => {
    it('should list assignment rules', async () => {
      mockPrisma.assignmentRule.findMany.mockResolvedValue([
        { id: 'rule-1', keyword: 'Uber', personId: 'p-1', userId: 'test-user-id' }
      ]);

      const res = await getRules(new Request('http://localhost/api/rules'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].keyword).toBe('Uber');
    });

    it('should create an assignment rule', async () => {
      mockPrisma.assignmentRule.create.mockResolvedValue({
        id: 'rule-2',
        keyword: '99app',
        personId: 'p-1',
        userId: 'test-user-id'
      });
      mockPrisma.assignmentRule.findMany.mockResolvedValue([]);

      const req = new Request('http://localhost/api/rules', {
        method: 'POST',
        body: JSON.stringify({ keyword: '99App', personId: 'p-1' })
      });

      const res = await postRule(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.keyword).toBe('99app');
    });
  });

  describe('Category Rules API', () => {
    it('should list category rules', async () => {
      mockPrisma.categoryRule.findMany.mockResolvedValue([
        { id: 'cat-rule-1', keyword: 'Netflix', category: 'Lazer', userId: 'test-user-id' }
      ]);

      const res = await getCategoryRules();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].keyword).toBe('Netflix');
    });

    it('should create a category rule', async () => {
      mockPrisma.categoryRule.create.mockResolvedValue({
        id: 'cat-rule-2',
        keyword: 'spotify',
        category: 'Lazer',
        userId: 'test-user-id'
      });
      mockPrisma.categoryRule.findFirst.mockResolvedValue(null);

      const req = new Request('http://localhost/api/category-rules', {
        method: 'POST',
        body: JSON.stringify({ keyword: 'Spotify', category: 'Lazer' })
      });

      const res = await postCategoryRule(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.keyword).toBe('spotify');
    });
  });
});
