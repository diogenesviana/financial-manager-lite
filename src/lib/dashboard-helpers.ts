interface PersonTotal {
  id: string
  total: number
}

/**
 * Calculates the total amount paid by users in the month.
 * Paid amount is the sum of totals for people who have marked their payment as true.
 */
export function calculateTotalPaid(
  totals: PersonTotal[],
  paymentStatuses: Record<string, boolean>
): number {
  return totals
    .filter(p => paymentStatuses[p.id] === true)
    .reduce((sum, p) => sum + p.total, 0)
}

/**
 * Calculates the total amount pending to be paid.
 * Pending amount is the sum of totals for people who have not paid (false or undefined)
 * plus any unassigned expenses.
 */
export function calculateTotalPending(
  totals: PersonTotal[],
  paymentStatuses: Record<string, boolean>,
  unassignedTotal: number
): number {
  const unpaidMembersSum = totals
    .filter(p => paymentStatuses[p.id] !== true)
    .reduce((sum, p) => sum + p.total, 0)
  return unpaidMembersSum + unassignedTotal
}
