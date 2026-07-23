import { jest } from '@jest/globals';
import './regression-helper';
import { GET as getMe } from '@/app/api/auth/me/route';
import { PUT as changePassword } from '@/app/api/auth/change-password/route';
import { GET as googleCallback } from '@/app/api/auth/google/callback/route';
import { mockPrisma } from './regression-helper';

describe('Auth Regression Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auth/me', () => {
    it('should return session user profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        email: 'user@test.com',
        name: 'Test User',
        role: 'USER',
        phone: null,
        avatar: null,
        forcePasswordReset: false,
        lastLogin: new Date()
      } as any);

      const res = await getMe();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user.name).toBe('Test User');
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        email: 'user@test.com',
        name: 'Test User',
        role: 'USER'
      } as any);
      mockPrisma.user.update.mockResolvedValue({ id: 'test-user-id' } as any);

      const req = new Request('http://localhost/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ newPassword: 'StrongPassword@123' })
      });

      const res = await changePassword(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('should reject weak password', async () => {
      const req = new Request('http://localhost/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ newPassword: 'weak' })
      });

      const res = await changePassword(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('A senha deve ter no mínimo 8 caracteres');
    });
  });

  describe('GET /api/auth/google/callback', () => {
    it('should redirect to login if code is missing', async () => {
      const req = new Request('http://localhost/api/auth/google/callback');
      const res = await googleCallback(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login?error=missing_code');
    });
  });
});
