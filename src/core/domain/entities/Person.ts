export interface Person {
  id: string
  name: string
  userId: string
  phone?: string | null
  avatar?: string | null
  linkedUserId?: string | null
  linkStatus?: string
  inviteEmail?: string | null
  createdAt: Date
  linkedUser?: {
    phone?: string | null
    avatar?: string | null
  } | null
}
