import { calculateTotalPaid, calculateTotalPending } from '../../src/lib/dashboard-helpers'

describe('Dashboard Helpers', () => {
  describe('calculateTotalPaid', () => {
    it('should return 0 when expenses array is empty', () => {
      const expenses: any[] = []
      expect(calculateTotalPaid(expenses)).toBe(0)
    })

    it('should sum only the amount of expenses that are paid', () => {
      const expenses = [
        { amount: 150, isPaid: true },
        { amount: 200, isPaid: false },
        { amount: 50 }, // undefined isPaid
      ]
      expect(calculateTotalPaid(expenses)).toBe(150)
    })

    it('should return 0 if no expense is paid', () => {
      const expenses = [
        { amount: 100, isPaid: false },
        { amount: 300, isPaid: false },
      ]
      expect(calculateTotalPaid(expenses)).toBe(0)
    })

    it('should handle all expenses paid', () => {
      const expenses = [
        { amount: 100, isPaid: true },
        { amount: 300, isPaid: true },
      ]
      expect(calculateTotalPaid(expenses)).toBe(400)
    })
  })

  describe('calculateTotalPending', () => {
    it('should return 0 when expenses is empty', () => {
      const expenses: any[] = []
      expect(calculateTotalPending(expenses)).toBe(0)
    })

    it('should sum only amount of pending expenses', () => {
      const expenses = [
        { amount: 150, isPaid: true },
        { amount: 200, isPaid: false },
        { amount: 50 }, // undefined isPaid
      ]
      expect(calculateTotalPending(expenses)).toBe(250)
    })

    it('should return 0 when all expenses are paid', () => {
      const expenses = [
        { amount: 100, isPaid: true },
        { amount: 250, isPaid: true },
      ]
      expect(calculateTotalPending(expenses)).toBe(0)
    })

    it('should return full total if all expenses are pending', () => {
      const expenses = [
        { amount: 100, isPaid: false },
        { amount: 250 },
      ]
      expect(calculateTotalPending(expenses)).toBe(350)
    })
  })
})
