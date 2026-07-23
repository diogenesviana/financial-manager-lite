import { NotificationService } from '../../../src/core/domain/services/NotificationService'
import { NotificationRepository } from '../../../src/core/domain/ports/NotificationRepository'

describe('NotificationService', () => {
  let mockNotificationRepo: jest.Mocked<NotificationRepository>

  beforeEach(() => {
    mockNotificationRepo = {
      create: jest.fn().mockResolvedValue({ id: 'notif-123' })
    } as any
  })

  describe('notifyExpensePaid', () => {
    it('deve criar uma notificação de gasto pago com a mensagem e título corretos', async () => {
      const description = 'Uber Trip'
      const creditorName = 'Diógenes Viana'
      const debtorUserId = 'user-debtor-123'

      await NotificationService.notifyExpensePaid(
        mockNotificationRepo,
        description,
        creditorName,
        debtorUserId
      )

      expect(mockNotificationRepo.create).toHaveBeenCalledTimes(1)
      expect(mockNotificationRepo.create).toHaveBeenCalledWith(
        debtorUserId,
        'Gasto Pago',
        'Diógenes Viana marcou o gasto "Uber Trip" como pago.'
      )
    })
  })

  describe('notifyMonthPaid', () => {
    it('deve criar uma notificação de fatura paga formatando o mês corretamente', async () => {
      const month = '2026-06'
      const creditorName = 'Diógenes Viana'
      const debtorUserId = 'user-debtor-123'

      await NotificationService.notifyMonthPaid(
        mockNotificationRepo,
        month,
        creditorName,
        debtorUserId
      )

      expect(mockNotificationRepo.create).toHaveBeenCalledTimes(1)
      expect(mockNotificationRepo.create).toHaveBeenCalledWith(
        debtorUserId,
        'Fatura Paga',
        'Diógenes Viana marcou todas as suas despesas de 06/2026 como pagas.'
      )
    })
  })
})
