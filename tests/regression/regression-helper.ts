import { jest } from '@jest/globals';

// Mock pdf.worker.mjs to prevent syntax error in Jest
jest.mock('pdfjs-dist/legacy/build/pdf.worker.mjs', () => ({}));

// Mock jose module directly to prevent SyntaxError with ESM export
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: (jest.fn() as any).mockResolvedValue('mock-token')
  })),
  jwtVerify: (jest.fn() as any).mockResolvedValue({ payload: { id: 'test-user-id' } })
}));

// Mock JoseTokenService to prevent importing "jose" package in Jest environment
jest.mock('@/adapters/auth/JoseTokenService', () => {
  return {
    JoseTokenService: jest.fn().mockImplementation(() => {
      return {
        sign: (jest.fn() as any).mockResolvedValue('mock-token'),
        verify: (jest.fn() as any).mockResolvedValue({
          id: 'test-user-id',
          email: 'user@test.com',
          name: 'Test User',
          role: 'USER'
        })
      };
    })
  };
});

// 1. Mock Authentication
jest.mock('@/lib/auth', () => ({
  getCurrentUser: (jest.fn() as any).mockResolvedValue({
    id: 'test-user-id',
    email: 'user@test.com',
    name: 'Test User',
    role: 'USER'
  })
}));

// 2. Mock Prisma Client
export const mockPrisma: any = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  person: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
  },
  expense: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  systemCategory: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
  systemBank: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
  categoryRule: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  assignmentRule: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  paymentStatus: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  }
};

jest.mock('@/lib/prisma', () => {
  return {
    __esModule: true,
    default: mockPrisma,
    getAuditPrisma: jest.fn().mockReturnValue(mockPrisma)
  };
});
