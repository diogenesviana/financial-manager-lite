import { JoseTokenService } from '@/adapters/auth/JoseTokenService'
import { BcryptHasher } from '@/adapters/auth/BcryptHasher'
import { cookies } from 'next/headers'

export const tokenService = new JoseTokenService()
export const passwordHasher = new BcryptHasher()

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null

    const payload = await tokenService.verify(token)
    if (!payload) return null

    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as 'USER' | 'ADMIN',
    }
  } catch (error) {
    return null
  }
}
