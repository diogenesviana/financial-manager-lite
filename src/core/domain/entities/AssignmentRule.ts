export interface AssignmentRule {
  id: string
  keyword: string
  personId: string
  userId: string
  createdAt: Date
  person?: {
    id: string
    name: string
  }
}
