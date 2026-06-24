interface ExpenseItem {
  amount: number
  isPaid?: boolean
  personId?: string | null
}

/**
 * Calculates the total amount paid based on individual expenses.
 */
export function calculateTotalPaid(expenses: ExpenseItem[]): number {
  return expenses
    .filter(e => e.isPaid === true)
    .reduce((sum, e) => sum + e.amount, 0)
}

/**
 * Calculates the total amount pending based on individual expenses.
 */
export function calculateTotalPending(expenses: ExpenseItem[]): number {
  return expenses
    .filter(e => e.isPaid !== true)
    .reduce((sum, e) => sum + e.amount, 0)
}
