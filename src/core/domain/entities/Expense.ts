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
  createdAt: Date
}
