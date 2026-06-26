import { NotificationService, PrismaClientLite } from '../../../src/core/domain/services/NotificationService'

describe('NotificationService', () => {
  let mockPrisma: jest.Mocked<PrismaClientLite>

  beforeEach(() => {
    mockPrisma = {
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-123' })
      }
    } as any
  })

  describe('notifyExpensePaid', () => {
    it('deve criar uma notificação de gasto pago com a mensagem e título corretos', async () => {
      const description = 'Uber Trip'
      const creditorName = 'Diógenes Viana'
      const debtorUserId = 'user-debtor-123'

      await NotificationService.notifyExpensePaid(
        mockPrisma,
        description,
        creditorName,
        debtorUserId
      )

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: debtorUserId,
          title: 'Gasto Pago',
          message: 'Diógenes Viana marcou o gasto "Uber Trip" como pago.'
        }
      })
    })
  })

  describe('notifyMonthPaid', () => {
    it('deve criar uma notificação de fatura paga formatando o mês corretamente', async () => {
      const month = '2026-06'
      const creditorName = 'Diógenes Viana'
      const debtorUserId = 'user-debtor-123'

      await NotificationService.notifyMonthPaid(
        mockPrisma,
        month,
        creditorName,
        debtorUserId
      )

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: debtorUserId,
          title: 'Fatura Paga',
          message: 'Diógenes Viana marcou todas as suas despesas de 06/2026 como pagas.'
        }
      })
    })
  })
})
