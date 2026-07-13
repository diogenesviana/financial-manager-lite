import { UserRepository } from '../domain/ports/UserRepository'
import { SyncSelfPersonUseCase } from './SyncSelfPerson'
import { User } from '../domain/entities/User'

export interface UpdateProfileInput {
  userId: string
  name?: string
  phone?: string
  avatar?: string
}

export class UpdateProfileUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly syncSelfPersonUseCase: SyncSelfPersonUseCase
  ) {}

  async execute(input: UpdateProfileInput): Promise<User> {
    const { userId, name, phone, avatar } = input

    // 1. Validar e formatar inputs
    let cleanName: string | undefined
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        throw new Error('Nome é obrigatório')
      }
      cleanName = name.trim()
    }

    let cleanPhone: string | undefined
    if (phone !== undefined) {
      if (typeof phone !== 'string' || !phone.trim()) {
        throw new Error('Telefone é obrigatório')
      }
      const rawPhone = phone.replace(/\D/g, '')
      if (rawPhone.length < 10) {
        throw new Error('Telefone inválido. Digite DDD + Número.')
      }
      cleanPhone = rawPhone
    }

    if (cleanName === undefined && cleanPhone === undefined && avatar === undefined) {
      throw new Error('Nenhum dado fornecido para atualização')
    }

    // 2. Buscar o usuário atual
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('Usuário não encontrado')
    }

    // 3. Atualizar dados do usuário
    if (cleanName !== undefined) user.name = cleanName
    if (cleanPhone !== undefined) user.phone = cleanPhone
    if (avatar !== undefined) user.avatar = avatar

    const updatedUser = await this.userRepository.save(user)

    // 4. Sincronizar os dados com o self-person associado (para exibição correta na divisão de faturas)
    await this.syncSelfPersonUseCase.execute({
      userId: updatedUser.id,
      userName: updatedUser.name,
      userPhone: updatedUser.phone || null,
      userEmail: updatedUser.email,
      userAvatar: updatedUser.avatar || null
    })

    return updatedUser
  }
}
