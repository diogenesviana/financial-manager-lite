import { jest } from '@jest/globals';
import './regression-helper';
import { POST as uploadInvoice } from '@/app/api/upload/route';
import { mockPrisma } from './regression-helper';

describe('Upload Regression Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/upload', () => {
    it('should return error if file is missing', async () => {
      const formData = new FormData();
      formData.append('month', '2026-07');
      const req = new Request('http://localhost/api/upload', {
        method: 'POST',
        body: formData
      });

      const res = await uploadInvoice(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Nenhum arquivo enviado');
    });
  });
});
