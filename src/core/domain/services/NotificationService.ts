export interface PrismaClientLite {
  notification: {
    create: (args: { data: { userId: string; title: string; message: string } }) => Promise<any>
  }
}

/**
 * Serviço responsável por encapsular as regras de criação de notificações
 * no sistema, facilitando a reutilização e os testes unitários.
 */
export class NotificationService {
  /**
   * Envia uma notificação informando que um gasto específico foi pago pelo credor.
   */
  static async notifyExpensePaid(
    prismaClient: PrismaClientLite,
    expenseDescription: string,
    creditorName: string,
    debtorUserId: string
  ): Promise<void> {
    await prismaClient.notification.create({
      data: {
        userId: debtorUserId,
        title: 'Gasto Pago',
        message: `${creditorName} marcou o gasto "${expenseDescription}" como pago.`
      }
    })
  }

  /**
   * Envia uma notificação informando que todas as despesas de um determinado mês foram pagas.
   */
  static async notifyMonthPaid(
    prismaClient: PrismaClientLite,
    month: string,
    creditorName: string,
    debtorUserId: string
  ): Promise<void> {
    const [year, monthNum] = month.split('-')
    const monthFormatted = `${monthNum}/${year}`
    await prismaClient.notification.create({
      data: {
        userId: debtorUserId,
        title: 'Fatura Paga',
        message: `${creditorName} marcou todas as suas despesas de ${monthFormatted} como pagas.`
      }
    })
  }
}
