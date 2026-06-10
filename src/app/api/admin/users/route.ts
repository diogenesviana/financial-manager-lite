import { NextResponse } from 'next/server'
import { PrismaUserRepository } from '@/adapters/db/PrismaUserRepository'
import { BcryptHasher } from '@/adapters/auth/BcryptHasher'
import { RegisterUserUseCase } from '@/core/use-cases/RegisterUser'
import { ManageUsersUseCase } from '@/core/use-cases/ManageUsers'
import { getCurrentUser } from '@/lib/auth'

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

    const { name, email, password, role } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 })
    }

    const newUser = await registerUseCase.execute({
      name,
      email,
      passwordHash: password,
      role: role || 'USER',
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao cadastrar usuário' }, { status: 400 })
  }
}
