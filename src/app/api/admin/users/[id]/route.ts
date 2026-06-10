import { NextResponse } from 'next/server'
import { PrismaUserRepository } from '@/adapters/db/PrismaUserRepository'
import { ManageUsersUseCase } from '@/core/use-cases/ManageUsers'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const userRepository = new PrismaUserRepository()
const manageUseCase = new ManageUsersUseCase(userRepository)

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 })
    }

    if (currentUser.id === id) {
      return NextResponse.json({ error: 'Você não pode excluir a sua própria conta' }, { status: 400 })
    }

    await manageUseCase.deleteUser(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 })
  }
}
