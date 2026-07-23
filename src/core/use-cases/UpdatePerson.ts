import { PersonRepository } from '../domain/ports/PersonRepository';
import { UserRepository } from '../domain/ports/UserRepository';
import { Person } from '../domain/entities/Person';

export interface UpdatePersonInput {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  phone?: string | null;
  inviteEmail?: string | null;
  isSystemUser: boolean;
  avatar?: string | null;
}

export class UpdatePerson {
  constructor(
    private personRepo: PersonRepository,
    private userRepo: UserRepository
  ) {}

  async execute(input: UpdatePersonInput): Promise<Person> {
    const { id, userId, userEmail, name, phone, inviteEmail, isSystemUser, avatar } = input;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error('Nome é obrigatório');
    }

    const person = await this.personRepo.findById(id);
    if (!person || person.userId !== userId) {
      throw new Error('Pessoa não encontrada');
    }

    // Check duplicate name
    if (name.trim().toLowerCase() !== person.name.toLowerCase()) {
      const existingPeople = await this.personRepo.findByUser(userId);
      const isDuplicate = existingPeople.some(p => p.id !== id && p.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (isDuplicate) {
        throw new Error('Uma pessoa com este nome já está cadastrada.');
      }
    }

    let dbUser = await this.userRepo.findById(userId);

    let linkedUserId = person.linkedUserId;
    let linkStatus = person.linkStatus;
    let inviteEmailVal = person.inviteEmail;
    let finalPhone = phone ? phone.replace(/\D/g, '') : null;

    if (person.linkedUserId === userId && person.userId === userId) {
      if (!isSystemUser) {
        throw new Error('Você não pode desvincular o seu próprio integrante do sistema.');
      }
      if (inviteEmail && inviteEmail.trim().toLowerCase() !== userEmail.toLowerCase()) {
        throw new Error('Você não pode alterar o e-mail de vínculo do seu próprio integrante.');
      }
      if (phone && phone.trim() !== dbUser?.phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length >= 10 && dbUser) {
          dbUser.phone = cleaned;
          await this.userRepo.save(dbUser);
        }
      }
    }

    if (isSystemUser) {
      if (person.linkedUserId === userId && person.userId === userId) {
        linkedUserId = userId;
        linkStatus = 'ACCEPTED';
        inviteEmailVal = userEmail.toLowerCase();
        finalPhone = null;
      } else {
        if (!inviteEmail || typeof inviteEmail !== 'string' || !inviteEmail.trim()) {
          throw new Error('E-mail de convite é obrigatório para membros do sistema.');
        }
        const normalizedInviteEmail = inviteEmail.trim().toLowerCase();
        if (normalizedInviteEmail === userEmail.toLowerCase()) {
          throw new Error('Você não pode convidar a si mesmo.');
        }

        finalPhone = null;

        const currentInviteEmail = person.inviteEmail ? person.inviteEmail.toLowerCase() : null;
        if (normalizedInviteEmail !== currentInviteEmail || person.linkStatus === 'NONE' || person.linkStatus === 'REJECTED') {
          linkStatus = 'PENDING';
          inviteEmailVal = normalizedInviteEmail;
          const targetUser = await this.userRepo.findByEmail(normalizedInviteEmail);
          if (targetUser) {
            linkedUserId = targetUser.id;
          } else {
            linkedUserId = null;
          }
        }
      }
    } else {
      linkedUserId = null;
      linkStatus = 'NONE';
      inviteEmailVal = null;
    }

    person.name = name.trim();
    person.phone = finalPhone;
    person.linkedUserId = linkedUserId;
    person.linkStatus = linkStatus || 'NONE';
    person.inviteEmail = inviteEmailVal;
    if (avatar !== undefined && !isSystemUser) {
      person.avatar = avatar;
    }

    return this.personRepo.save(person);
  }
}
