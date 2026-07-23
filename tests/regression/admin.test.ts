import { jest } from '@jest/globals';
import './regression-helper';
import { GET as getCategories, POST as postCategory } from '@/app/api/admin/categories/route';
import { GET as getBanks, POST as postBank } from '@/app/api/admin/banks/route';
import { POST as wipeSystem } from '@/app/api/admin/wipe/route';
import { mockPrisma } from './regression-helper';
import { getCurrentUser } from '@/lib/auth';

describe('Admin Regression Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentUser as any).mockResolvedValue({
      id: 'admin-user-id',
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'ADMIN'
    });
  });

  describe('Categories Admin API', () => {
    it('should list admin categories', async () => {
      mockPrisma.systemCategory.findMany.mockResolvedValue([
        { id: '1', name: 'Alimentação', color: '#ff0000', icon: 'food' }
      ]);

      const res = await getCategories();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('Alimentação');
    });

    it('should create an admin category', async () => {
      mockPrisma.systemCategory.findFirst.mockResolvedValue(null);
      mockPrisma.systemCategory.create.mockResolvedValue({
        id: '2',
        name: 'Transporte',
        color: '#00ff00',
        icon: 'car'
      });

      const req = new Request('http://localhost/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Transporte', color: '#00ff00', icon: 'car' })
      });

      const res = await postCategory(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.name).toBe('Transporte');
    });
  });

  describe('Banks Admin API', () => {
    it('should list admin banks', async () => {
      mockPrisma.systemBank.findMany.mockResolvedValue([
        { id: '1', name: 'Nubank', color: '#820ad1', logo: 'nu' }
      ]);

      const res = await getBanks();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('Nubank');
    });

    it('should create an admin bank', async () => {
      mockPrisma.systemBank.findFirst.mockResolvedValue(null);
      mockPrisma.systemBank.create.mockResolvedValue({
        id: '2',
        name: 'Inter',
        color: '#ff7a00',
        logo: 'inter'
      });

      const req = new Request('http://localhost/api/admin/banks', {
        method: 'POST',
        body: JSON.stringify({ name: 'Inter', color: '#ff7a00', logo: 'inter' })
      });

      const res = await postBank(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.name).toBe('Inter');
    });
  });

  describe('Wipe System Admin API', () => {
    it('should block non-admins from wiping the system', async () => {
      const mockUser = getCurrentUser as any;
      mockUser.mockResolvedValueOnce({ id: 'test-user-id', role: 'USER' });

      const req = new Request('http://localhost/api/admin/wipe', { method: 'POST' });
      const res = await wipeSystem(req);
      expect(res.status).toBe(403);
    });

    it('should allow admins to wipe the system', async () => {
      const mockUser = getCurrentUser as any;
      mockUser.mockResolvedValueOnce({ id: 'admin-user-id', role: 'ADMIN' });

      mockPrisma.expense.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.assignmentRule.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.person.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.user.deleteMany.mockResolvedValue({ count: 1 });

      const req = new Request('http://localhost/api/admin/wipe', { method: 'POST' });
      const res = await wipeSystem(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
