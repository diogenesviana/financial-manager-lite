import { NotificationRepository } from '../domain/ports/NotificationRepository';

export class MarkNotificationsRead {
  constructor(private notificationRepo: NotificationRepository) {}

  async execute(userId: string, data: { id?: string; readAll?: boolean }): Promise<void> {
    const { id, readAll } = data;
    if (readAll) {
      await this.notificationRepo.markAllAsRead(userId);
      return;
    }

    if (!id) {
      throw new Error('ID da notificação é obrigatório');
    }

    await this.notificationRepo.markAsRead(id, userId);
  }
}
