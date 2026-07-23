import { NotificationRepository } from '@/core/domain/ports/NotificationRepository';
import { Notification } from '@/core/domain/entities/Notification';
import prisma from '@/lib/prisma';

export class PrismaNotificationRepository implements NotificationRepository {
  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true }
    });
  }

  async create(userId: string, title: string, message: string): Promise<Notification> {
    return prisma.notification.create({
      data: { userId, title, message }
    });
  }

  async updateMessagesContaining(oldText: string, newText: string): Promise<void> {
    const notifications = await prisma.notification.findMany({
      where: {
        message: { contains: `"${oldText}"` }
      }
    });
    for (const notif of notifications) {
      const updatedMessage = notif.message.replace(`"${oldText}"`, `"${newText}"`);
      await prisma.notification.update({
        where: { id: notif.id },
        data: { message: updatedMessage }
      });
    }
  }
}
