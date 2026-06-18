import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { UpdateProfileUseCase } from '@/core/use-cases/UpdateProfile'
import { PrismaUserRepository } from '@/adapters/db/PrismaUserRepository'
import { PrismaPersonRepository } from '@/adapters/db/PrismaPersonRepository'
import { SyncSelfPersonUseCase } from '@/core/use-cases/SyncSelfPerson'

export const dynamic = 'force-dynamic'

const userRepository = new PrismaUserRepository()
const personRepository = new PrismaPersonRepository()
const syncSelfPersonUseCase = new SyncSelfPersonUseCase(personRepository)
const updateProfileUseCase = new UpdateProfileUseCase(userRepository, syncSelfPersonUseCase)

export async function PUT(request: Request) {
  try {
    const sessionUser = await getCurrentUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { name, phone, avatar } = await request.json()

    const updatedUser = await updateProfileUseCase.execute({
      userId: sessionUser.id,
      name,
      phone,
      avatar
    })

    return NextResponse.json({ 
      success: true, 
      user: { 
        id: updatedUser.id, 
        email: updatedUser.email, 
        name: updatedUser.name, 
        role: updatedUser.role, 
        phone: updatedUser.phone, 
        avatar: updatedUser.avatar 
      } 
    })
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error)
    const status = error.message.includes('obrigatório') || error.message.includes('inválido') ? 400 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
}
