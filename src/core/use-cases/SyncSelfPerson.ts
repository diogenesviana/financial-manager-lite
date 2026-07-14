import { PersonRepository } from '../domain/ports/PersonRepository'

export interface SyncSelfPersonInput {
  userId: string
  userName: string | null
  userPhone: string | null
  userEmail: string | null
  userAvatar?: string | null
}

export class SyncSelfPersonUseCase {
  constructor(
    private readonly personRepository: PersonRepository
  ) {}

  async execute(input: SyncSelfPersonInput): Promise<void> {
    const { userId, userName, userPhone, userEmail, userAvatar } = input

    if (!userPhone || !userName || !userEmail) {
      return // Precisamos dos dados completos para o self-person
    }

    // Buscar todas as pessoas vinculadas ao usuário
    const allPeople = await this.personRepository.findByUser(userId)
    
    // Identificar o self-person (aquele em que o linkedUserId é o próprio userId)
    const selfPersons = allPeople.filter(p => p.linkedUserId === userId)

    // Se não tiver nenhum, precisamos criar
    if (selfPersons.length === 0) {
      await this.personRepository.save({
        name: userName,
        phone: userPhone,
        avatar: userAvatar,
        userId: userId,
        linkedUserId: userId,
        linkStatus: 'ACCEPTED',
        inviteEmail: userEmail.toLowerCase()
      })
    } 
    // Se tiver mais de um (bug antigo ou duplicidade no BD), deduplicar
    else if (selfPersons.length > 1) {
      // Ordena por data de criação crescente
      selfPersons.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      
      const [keepPerson, ...duplicatePersons] = selfPersons
      
      // Deletar os duplicados
      for (const duplicate of duplicatePersons) {
        await this.personRepository.delete(duplicate.id)
      }
      
      // Garantir que o principal está atualizado
      if (keepPerson.name !== userName || keepPerson.phone !== userPhone || keepPerson.avatar !== userAvatar) {
        keepPerson.name = userName
        keepPerson.phone = userPhone
        keepPerson.avatar = userAvatar || null
        await this.personRepository.save(keepPerson)
      }
    } 
    // Se tiver exatamente um, atualizar dados se necessário
    else {
      const keepPerson = selfPersons[0]
      if (keepPerson.name !== userName || keepPerson.phone !== userPhone || keepPerson.inviteEmail !== userEmail.toLowerCase() || keepPerson.avatar !== userAvatar) {
        keepPerson.name = userName
        keepPerson.phone = userPhone
        keepPerson.inviteEmail = userEmail.toLowerCase()
        keepPerson.avatar = userAvatar || null
        await this.personRepository.save(keepPerson)
      }
    }

    // Sincronizar também com qualquer outra Person que esteja vinculada a este usuário (criadas por terceiros)
    await this.personRepository.updateLinkedAvatarAndPhone(userId, userAvatar || null, userPhone)
  }
}
