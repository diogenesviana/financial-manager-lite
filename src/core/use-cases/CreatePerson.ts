import { PersonRepository } from '../domain/ports/PersonRepository'
import { Person } from '../domain/entities/Person'

export interface CreatePersonInput {
  userId: string
  userEmail: string
  name: string
  phone?: string
  inviteEmail?: string
  isSystemUser: boolean
}

export class CreatePersonUseCase {
  constructor(
    private readonly personRepository: PersonRepository,
    // Using a generic function type or port for finding user by email to avoid direct Prisma
    private readonly findUserByEmail: (email: string) => Promise<{ id: string } | null>
  ) {}

  async execute(input: CreatePersonInput): Promise<Person> {
    const { userId, userEmail, name, phone, inviteEmail, isSystemUser } = input

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error('Nome é obrigatório')
    }

    // Verificar se já existe uma pessoa com o mesmo nome para este usuário
    const existingPeople = await this.personRepository.findByUser(userId)
    const normalizedNewName = name.trim().toLowerCase()
    const isDuplicate = existingPeople.some(p => p.name.trim().toLowerCase() === normalizedNewName)
    
    if (isDuplicate) {
      throw new Error('Uma pessoa com este nome já está cadastrada.')
    }

    let linkedUserId: string | null = null
    let linkStatus = 'NONE'
    let normalizedInviteEmail: string | null = null
    let finalPhone: string | null = phone ? phone.replace(/\D/g, '') : null

    if (isSystemUser) {
      if (!inviteEmail || typeof inviteEmail !== 'string' || !inviteEmail.trim()) {
        throw new Error('E-mail de convite é obrigatório para membros do sistema.')
      }
      
      normalizedInviteEmail = inviteEmail.trim().toLowerCase()
      
      // Evitar convidar a si mesmo
      if (normalizedInviteEmail === userEmail.toLowerCase()) {
        throw new Error('Você não pode convidar a si mesmo.')
      }

      linkStatus = 'PENDING'
      finalPhone = null // O telefone virá dinamicamente da conta do usuário quando ele aceitar/vincular
      
      // Buscar se o usuário alvo já existe no sistema
      const targetUser = await this.findUserByEmail(normalizedInviteEmail)
      if (targetUser) {
        linkedUserId = targetUser.id
      }
    }

    const personToSave = {
      name: name.trim(),
      userId,
      phone: finalPhone,
      linkedUserId,
      linkStatus,
      inviteEmail: normalizedInviteEmail
    }

    return await this.personRepository.save(personToSave)
  }
}
