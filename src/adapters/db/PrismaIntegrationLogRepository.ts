import { IntegrationLogRepository } from '@/core/domain/ports/IntegrationLogRepository';
import { IntegrationLog } from '@/core/domain/entities/IntegrationLog';
import prisma from '@/lib/prisma';

export class PrismaIntegrationLogRepository implements IntegrationLogRepository {
  async findRecent(limit: number): Promise<IntegrationLog[]> {
    const logs = await prisma.integrationLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    return logs.map(log => ({
      id: log.id,
      serviceName: log.serviceName,
      operation: log.operation,
      status: log.status as 'SUCCESS' | 'ERROR',
      requestData: log.requestData,
      responseData: log.responseData,
      errorMessage: log.errorMessage,
      durationMs: log.durationMs,
      userId: log.userId,
      createdAt: log.createdAt,
      user: log.user ? { name: log.user.name, email: log.user.email } : null
    }));
  }

  async save(log: Omit<IntegrationLog, 'id' | 'createdAt'>): Promise<IntegrationLog> {
    const saved = await prisma.integrationLog.create({
      data: {
        serviceName: log.serviceName,
        operation: log.operation,
        status: log.status,
        requestData: log.requestData ?? undefined,
        responseData: log.responseData ?? undefined,
        errorMessage: log.errorMessage ?? undefined,
        durationMs: log.durationMs,
        userId: log.userId ?? undefined
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    return {
      id: saved.id,
      serviceName: saved.serviceName,
      operation: saved.operation,
      status: saved.status as 'SUCCESS' | 'ERROR',
      requestData: saved.requestData,
      responseData: saved.responseData,
      errorMessage: saved.errorMessage,
      durationMs: saved.durationMs,
      userId: saved.userId,
      createdAt: saved.createdAt,
      user: saved.user ? { name: saved.user.name, email: saved.user.email } : null
    };
  }
}
