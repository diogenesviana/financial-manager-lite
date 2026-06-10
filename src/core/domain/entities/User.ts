export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  role: 'USER' | 'ADMIN'
  createdAt: Date
}
