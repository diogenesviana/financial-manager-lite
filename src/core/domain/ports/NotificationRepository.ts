import { Notification } from '../entities/Notification';

export interface NotificationRepository {
  findUnreadByUserId(userId: string): Promise<Notification[]>;
  markAllAsRead(userId: string): Promise<void>;
  markAsRead(id: string, userId: string): Promise<void>;
  create(userId: string, title: string, message: string): Promise<Notification>;
  updateMessagesContaining(oldText: string, newText: string): Promise<void>;
}
