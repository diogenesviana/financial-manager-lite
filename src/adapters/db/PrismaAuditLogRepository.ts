import { AuditLogRepository } from '@/core/domain/ports/AuditLogRepository';
import { AuditLog } from '@/core/domain/entities/AuditLog';
import prisma from '@/lib/prisma';

export class PrismaAuditLogRepository implements AuditLogRepository {
  async findRecent(limit: number): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
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
      modelName: log.modelName,
      recordId: log.recordId,
      action: log.action,
      oldData: log.oldData,
      newData: log.newData,
      userId: log.userId,
      createdAt: log.createdAt,
      user: log.user ? { name: log.user.name, email: log.user.email } : null
    }));
  }
}
