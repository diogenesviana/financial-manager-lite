export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  role: 'USER' | 'ADMIN'
  forcePasswordReset: boolean
  createdAt: Date
  phone?: string | null
  avatar?: string | null
  lastLogin?: Date | null
}
