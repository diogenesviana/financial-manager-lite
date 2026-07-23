import { PersonRepository } from '../domain/ports/PersonRepository'
import { UserRepository } from '../domain/ports/UserRepository'
import { NotificationRepository } from '../domain/ports/NotificationRepository'
import { Person } from '../domain/entities/Person'

export interface HandleInviteInput {
  personId: string
  action: 'ACCEPT' | 'REJECT'
  userId: string
  userEmail: string
  userName: string
}

export class HandleInviteUseCase {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly userRepository: UserRepository,
    private readonly notificationRepository: NotificationRepository
  ) {}

  async execute(input: HandleInviteInput): Promise<Person> {
    const { personId, action, userId, userEmail, userName } = input
    
    // 1. Fetch the person (invite)
    const person = await this.personRepository.findById(personId)
    if (!person) {
      throw new Error('Convite não encontrado')
    }

    // 2. Verify target user
    const isTargetUser = 
      person.linkedUserId === userId || 
      (person.inviteEmail && person.inviteEmail.toLowerCase() === userEmail.toLowerCase())

    if (!isTargetUser || person.linkStatus !== 'PENDING') {
      throw new Error('Convite não autorizado ou já processado')
    }

    // 3. Update status
    person.linkStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED'
    person.linkedUserId = userId // Atualiza o ID caso tenha sido convidado apenas por e-mail

    const updatedPerson = await this.personRepository.save(person)

    // 4. Se foi aceito, tentar criar o vínculo bidirecional
    if (action === 'ACCEPT') {
      const inviterUser = await this.userRepository.findById(person.userId)

      if (inviterUser) {
        // Buscar se o usuário que aceitou já tinha cadastrado o inviter localmente
        const localPersons = await this.personRepository.findByUser(userId)
        
        const localFriend = localPersons.find(p => {
          if (p.linkedUserId) return false // Já vinculado a outra pessoa

          let matchEmail = false
          let matchPhone = false

          if (inviterUser.email && p.inviteEmail) {
            matchEmail = p.inviteEmail.toLowerCase() === inviterUser.email.toLowerCase()
          }

          if (inviterUser.phone && p.phone) {
            const inviterClean = inviterUser.phone.replace(/\D/g, '')
            const pClean = p.phone.replace(/\D/g, '')
            matchPhone = inviterClean === pClean || p.phone === inviterUser.phone
          }

          return matchEmail || matchPhone
        })

        if (localFriend) {
          // Se encontrou o amigo cadastrado localmente, criar o vínculo mútuo
          localFriend.linkedUserId = inviterUser.id
          localFriend.linkStatus = 'ACCEPTED'
          localFriend.inviteEmail = inviterUser.email.toLowerCase()
          
          await this.personRepository.save(localFriend)
        }
      }

      if (updatedPerson.userId) {
        await this.notificationRepository.create(
          updatedPerson.userId,
          'Convite Aceito',
          `${userName} aceitou seu pedido de compartilhamento e agora vocês estão vinculados!`
        )
      }
    }

    return updatedPerson
  }
}
