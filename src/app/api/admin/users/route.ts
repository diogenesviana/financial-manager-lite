import { NextResponse } from 'next/server'
import { PrismaUserRepository } from '@/adapters/db/PrismaUserRepository'
import { BcryptHasher } from '@/adapters/auth/BcryptHasher'
import { RegisterUserUseCase } from '@/core/use-cases/RegisterUser'
import { ManageUsersUseCase } from '@/core/use-cases/ManageUsers'
import { getCurrentUser } from '@/lib/auth'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const userRepository = new PrismaUserRepository()
const passwordHasher = new BcryptHasher()
const registerUseCase = new RegisterUserUseCase(userRepository, passwordHasher)
const manageUseCase = new ManageUsersUseCase(userRepository)

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 })
    }

    const users = await manageUseCase.listAll()
    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 })
    }

    const { name, email, role } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e e-mail são obrigatórios' }, { status: 400 })
    }

    // Generate a secure temporary password that matches the regex
    const randomHex = crypto.randomBytes(4).toString('hex')
    const specialChars = ['@', '$', '!', '%', '*', '?', '&']
    const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)]
    const generatedPassword = `Temp${randomHex}${randomSpecial}1` // e.g. Temp1a2b3c4d@1

    const newUser = await registerUseCase.execute({
      name,
      email,
      passwordHash: generatedPassword,
      role: role || 'USER',
      forcePasswordReset: true,
    })

    return NextResponse.json({ ...newUser, generatedPassword }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao cadastrar usuário' }, { status: 400 })
  }
}
