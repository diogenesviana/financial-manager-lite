import { NotificationRepository } from '../domain/ports/NotificationRepository';
import { Notification } from '../domain/entities/Notification';

export class ListNotifications {
  constructor(private notificationRepo: NotificationRepository) {}

  async execute(userId: string): Promise<Notification[]> {
    return this.notificationRepo.findUnreadByUserId(userId);
  }
}
