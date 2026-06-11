export interface Person {
  id: string
  name: string
  userId: string
  phone?: string | null
  linkedUserId?: string | null
  linkStatus?: string
  inviteEmail?: string | null
  createdAt: Date
}
