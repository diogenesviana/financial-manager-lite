export interface Expense {
  id: string
  date: Date
  description: string
  amount: number
  personId: string | null
  card: string | null
  isManual: boolean
  month: string
  userId: string
  sharedStatus?: string
  category?: string | null
  createdAt: Date
  originalDescription?: string | null
  originalAmount?: number | null
  isPaid?: boolean
}
