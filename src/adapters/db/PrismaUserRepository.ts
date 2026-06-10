import { UserRepository } from '@/core/domain/ports/UserRepository'
import { User } from '@/core/domain/entities/User'
import prisma from '@/lib/prisma'

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return null
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.password,
      role: user.role as 'USER' | 'ADMIN',
      createdAt: user.createdAt,
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return null
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.password,
      role: user.role as 'USER' | 'ADMIN',
      createdAt: user.createdAt,
    }
  }

  async save(user: Omit<User, 'id' | 'createdAt'> & { id?: string }): Promise<User> {
    const data = {
      email: user.email,
      name: user.name,
      password: user.passwordHash,
      role: user.role,
    }
    
    let saved
    if (user.id) {
      saved = await prisma.user.update({
        where: { id: user.id },
        data,
      })
    } else {
      saved = await prisma.user.create({
        data,
      })
    }

    return {
      id: saved.id,
      email: saved.email,
      name: saved.name,
      passwordHash: saved.password,
      role: saved.role as 'USER' | 'ADMIN',
      createdAt: saved.createdAt,
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } })
  }

  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.password,
      role: user.role as 'USER' | 'ADMIN',
      createdAt: user.createdAt,
    }))
  }
}
