import { PersonRepository } from '@/core/domain/ports/PersonRepository'
import { Person } from '@/core/domain/entities/Person'
import prisma from '@/lib/prisma'

export class PrismaPersonRepository implements PersonRepository {
  async findById(id: string): Promise<Person | null> {
    const p = await prisma.person.findUnique({ where: { id } })
    if (!p) return null
    return {
      id: p.id,
      name: p.name,
      userId: p.userId,
      createdAt: p.createdAt,
    }
  }

  async findByUser(userId: string): Promise<Person[]> {
    const people = await prisma.person.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    })
    return people.map(p => ({
      id: p.id,
      name: p.name,
      userId: p.userId,
      createdAt: p.createdAt,
    }))
  }

  async save(person: Omit<Person, 'id' | 'createdAt'> & { id?: string }): Promise<Person> {
    const data = {
      name: person.name,
      userId: person.userId,
    }

    let saved
    if (person.id) {
      saved = await prisma.person.update({
        where: { id: person.id },
        data,
      })
    } else {
      saved = await prisma.person.create({
        data,
      })
    }

    return {
      id: saved.id,
      name: saved.name,
      userId: saved.userId,
      createdAt: saved.createdAt,
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.person.delete({ where: { id } })
  }
}
