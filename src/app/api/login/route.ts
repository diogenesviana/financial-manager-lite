import { NextResponse } from 'next/server'
import { PrismaUserRepository } from '@/adapters/db/PrismaUserRepository'
import { BcryptHasher } from '@/adapters/auth/BcryptHasher'
import { JoseTokenService } from '@/adapters/auth/JoseTokenService'
import { LoginUserUseCase } from '@/core/use-cases/LoginUser'

export const dynamic = 'force-dynamic'

const userRepository = new PrismaUserRepository()
const passwordHasher = new BcryptHasher()
const tokenService = new JoseTokenService()
const loginUseCase = new LoginUserUseCase(userRepository, passwordHasher, tokenService)

export async function POST(request: Request) {
  try {
    const { email, password, rememberMe } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 })
    }

    const result = await loginUseCase.execute(email, password, rememberMe)

    const response = NextResponse.json({ success: true, user: result.user })

    // Set secure HTTP-only cookie
    response.cookies.set('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.expiresIn,
      path: '/',
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao realizar login' }, { status: 401 })
  }
}
