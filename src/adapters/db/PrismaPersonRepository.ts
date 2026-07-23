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
      phone: p.phone,
      avatar: p.avatar,
      linkedUserId: p.linkedUserId,
      linkStatus: p.linkStatus,
      inviteEmail: p.inviteEmail,
      createdAt: p.createdAt,
    }
  }

  async findByUser(userId: string): Promise<Person[]> {
    const people = await prisma.person.findMany({
      where: { userId },
      include: {
        linkedUser: {
          select: {
            phone: true,
            avatar: true
          }
        }
      },
      orderBy: { name: 'asc' },
    })
    return people.map(p => ({
      id: p.id,
      name: p.name,
      userId: p.userId,
      phone: p.phone,
      avatar: p.avatar,
      linkedUserId: p.linkedUserId,
      linkStatus: p.linkStatus,
      inviteEmail: p.inviteEmail,
      createdAt: p.createdAt,
      linkedUser: p.linkedUser ? { phone: p.linkedUser.phone, avatar: p.linkedUser.avatar } : null
    }))
  }

  async save(person: Omit<Person, 'id' | 'createdAt'> & { id?: string }): Promise<Person> {
    const data = {
      name: person.name,
      userId: person.userId,
      phone: person.phone,
      avatar: person.avatar,
      linkedUserId: person.linkedUserId,
      linkStatus: person.linkStatus,
      inviteEmail: person.inviteEmail,
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
      phone: saved.phone,
      avatar: saved.avatar,
      linkedUserId: saved.linkedUserId,
      linkStatus: saved.linkStatus,
      inviteEmail: saved.inviteEmail,
      createdAt: saved.createdAt,
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.person.delete({ where: { id } })
  }

  async clearAllByUser(userId: string): Promise<void> {
    await prisma.person.deleteMany({
      where: {
        userId,
        OR: [
          { linkedUserId: null },
          {
            linkedUserId: {
              not: userId
            }
          }
        ]
      }
    })
  }

  async updateLinkedAvatarAndPhone(linkedUserId: string, avatar: string | null, phone: string | null): Promise<void> {
    await prisma.person.updateMany({
      where: { linkedUserId },
      data: {
        avatar,
        phone
      }
    })
  }

  async findPendingInvites(email: string, userId: string): Promise<Person[]> {
    const invites = await prisma.person.findMany({
      where: {
        OR: [
          { inviteEmail: email.toLowerCase(), linkStatus: 'PENDING' },
          { linkedUserId: userId, linkStatus: 'PENDING' }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true,
          }
        }
      }
    })
    return invites.map((inv: any) => ({
      id: inv.id,
      name: inv.name,
      inviteEmail: inv.inviteEmail,
      linkStatus: inv.linkStatus,
      userId: inv.userId,
      linkedUserId: inv.linkedUserId,
      createdAt: inv.createdAt,
      phone: inv.phone,
      avatar: inv.avatar,
      // Pass extra relation properties mapped dynamically
      ownerName: inv.user?.name || 'Usuário',
      ownerEmail: inv.user?.email || '',
      ownerAvatar: inv.user?.avatar || null
    })) as any
  }
}
