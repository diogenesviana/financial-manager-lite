import { AssignmentRule } from '../entities/AssignmentRule'

export interface AssignmentRuleRepository {
  findById(id: string): Promise<AssignmentRule | null>
  findByUser(userId: string): Promise<AssignmentRule[]>
  save(rule: Omit<AssignmentRule, 'id' | 'createdAt'> & { id?: string }): Promise<AssignmentRule>
  delete(id: string): Promise<void>
}
