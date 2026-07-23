import { NotificationRepository } from '../ports/NotificationRepository';

/**
 * Serviço responsável por encapsular as regras de criação de notificações
 * no sistema, facilitando a reutilização e os testes unitários.
 */
export class NotificationService {
  /**
   * Envia uma notificação informando que um gasto específico foi pago pelo credor.
   */
  static async notifyExpensePaid(
    notificationRepo: NotificationRepository,
    expenseDescription: string,
    creditorName: string,
    debtorUserId: string
  ): Promise<void> {
    await notificationRepo.create(
      debtorUserId,
      'Gasto Pago',
      `${creditorName} marcou o gasto "${expenseDescription}" como pago.`
    );
  }

  /**
   * Envia uma notificação informando que todas as despesas de um determinado mês foram pagas.
   */
  static async notifyMonthPaid(
    notificationRepo: NotificationRepository,
    month: string,
    creditorName: string,
    debtorUserId: string
  ): Promise<void> {
    const [year, monthNum] = month.split('-');
    const monthFormatted = `${monthNum}/${year}`;
    await notificationRepo.create(
      debtorUserId,
      'Fatura Paga',
      `${creditorName} marcou todas as suas despesas de ${monthFormatted} como pagas.`
    );
  }
}
