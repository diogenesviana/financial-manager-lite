import { calculateTotalPaid, calculateTotalPending } from '../../src/lib/dashboard-helpers'

describe('Dashboard Helpers', () => {
  describe('calculateTotalPaid', () => {
    it('should return 0 when totals array is empty', () => {
      const totals: any[] = []
      const paymentStatuses = {}
      expect(calculateTotalPaid(totals, paymentStatuses)).toBe(0)
    })

    it('should sum only the totals of people who have paid', () => {
      const totals = [
        { id: 'user-1', total: 150 },
        { id: 'user-2', total: 200 },
        { id: 'user-3', total: 50 },
      ]
      const paymentStatuses = {
        'user-1': true,
        'user-2': false,
        // user-3 is undefined (not paid)
      }
      expect(calculateTotalPaid(totals, paymentStatuses)).toBe(150)
    })

    it('should return 0 if no one has paid', () => {
      const totals = [
        { id: 'user-1', total: 100 },
        { id: 'user-2', total: 300 },
      ]
      const paymentStatuses = {
        'user-1': false,
        'user-2': false,
      }
      expect(calculateTotalPaid(totals, paymentStatuses)).toBe(0)
    })

    it('should handle all members paid', () => {
      const totals = [
        { id: 'user-1', total: 100 },
        { id: 'user-2', total: 300 },
      ]
      const paymentStatuses = {
        'user-1': true,
        'user-2': true,
      }
      expect(calculateTotalPaid(totals, paymentStatuses)).toBe(400)
    })
  })

  describe('calculateTotalPending', () => {
    it('should return only unassignedTotal when totals is empty', () => {
      const totals: any[] = []
      const paymentStatuses = {}
      const unassignedTotal = 75.5
      expect(calculateTotalPending(totals, paymentStatuses, unassignedTotal)).toBe(75.5)
    })

    it('should sum totals of unpaid members and add unassignedTotal', () => {
      const totals = [
        { id: 'user-1', total: 150 },
        { id: 'user-2', total: 200 },
        { id: 'user-3', total: 50 },
      ]
      const paymentStatuses = {
        'user-1': true,
        'user-2': false,
        // user-3 is undefined (not paid)
      }
      const unassignedTotal = 120.45
      // user-2 (200) + user-3 (50) + unassigned (120.45) = 370.45
      expect(calculateTotalPending(totals, paymentStatuses, unassignedTotal)).toBe(370.45)
    })

    it('should return 0 when everyone has paid and unassignedTotal is 0', () => {
      const totals = [
        { id: 'user-1', total: 100 },
        { id: 'user-2', total: 250 },
      ]
      const paymentStatuses = {
        'user-1': true,
        'user-2': true,
      }
      expect(calculateTotalPending(totals, paymentStatuses, 0)).toBe(0)
    })

    it('should return full grand total if no one has paid and everything is pending', () => {
      const totals = [
        { id: 'user-1', total: 100 },
        { id: 'user-2', total: 250 },
      ]
      const paymentStatuses = {
        'user-1': false,
        'user-2': false,
      }
      const unassignedTotal = 50
      expect(calculateTotalPending(totals, paymentStatuses, unassignedTotal)).toBe(400)
    })
  })
})
