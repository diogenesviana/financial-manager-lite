export interface PersonLinkInfo {
  linkedUserId?: string | null
  linkStatus?: string | null
}

/**
 * Determina o sharedStatus de uma despesa com base na pessoa atribuída.
 * 
 * Regras:
 * - Se personId é null (sem atribuição), retorna 'ACCEPTED'
 * - Se a pessoa é um membro local (sem linkedUserId), retorna 'ACCEPTED'
 * - Se a pessoa está vinculada a outro usuário do sistema (linkStatus === 'ACCEPTED'), 
 *   retorna 'PENDING' (aguardando aprovação do outro usuário)
 * - Caso contrário (convite pendente, rejeitado, etc.), retorna 'ACCEPTED'
 * 
 * Esta função é usada em vários contextos no sistema, centralizando a lógica
 * de definição do status de compartilhamento.
 */
export function resolveSharedStatusFromPerson(person: PersonLinkInfo | null): string {
  if (
    person &&
    person.linkedUserId &&
    person.linkStatus === 'ACCEPTED'
  ) {
    return 'PENDING'
  }
  return 'ACCEPTED'
}
