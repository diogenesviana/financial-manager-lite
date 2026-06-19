import { ParsedTransaction } from '@/core/domain/ports/AiParser'
import { resolveSharedStatusFromPerson } from '@/core/domain/services/SharedStatusService'

/**
 * Representa uma regra de atribuição automática carregada do banco,
 * incluindo os dados da pessoa vinculada.
 */
export interface AssignmentRuleWithPerson {
  id: string
  keyword: string
  personId: string
  person: {
    id: string
    name: string
    linkedUserId: string | null
    linkStatus: string
  } | null
}

/**
 * Representa uma regra de categorização automática.
 */
export interface CategoryRuleData {
  id: string
  keyword: string
  category: string
  userId: string
}

/**
 * Representa uma despesa já existente no banco para checagem de duplicatas.
 */
export interface ExistingExpense {
  id: string
  date: Date
  description: string
  amount: number
  card: string | null
  originalDescription?: string | null
  originalAmount?: number | null
}

/**
 * Resultado do processamento de uma fatura já parseada.
 */
export interface ProcessedExpense {
  date: Date
  description: string
  amount: number
  card: string | null
  isManual: boolean
  month: string
  userId: string
  personId: string | null
  category: string
  sharedStatus: string
}

export interface ProcessInvoiceResult {
  expenses: ProcessedExpense[]
  skippedDuplicates: number
  autoAssigned: number
  newCategoryRules: { keyword: string; category: string }[]
}

/**
 * Use case que contém toda a lógica de negócio de processamento de faturas.
 * Recebe transações já parseadas (vindas da IA ou regex) e aplica:
 * - Deduplicação contra despesas existentes
 * - Regras de atribuição automática (AssignmentRule)
 * - Regras de categorização automática (CategoryRule)
 * - Definição de sharedStatus baseado no vínculo da pessoa
 */
export class ProcessInvoice {
  /**
   * Processa uma lista de transações parseadas e retorna as despesas prontas
   * para serem salvas no banco de dados.
   */
  execute(
    parsedTransactions: ParsedTransaction[],
    existingExpenses: ExistingExpense[],
    assignmentRules: AssignmentRuleWithPerson[],
    categoryRules: CategoryRuleData[],
    resolvedMonth: string,
    userId: string
  ): ProcessInvoiceResult {
    const matchedIds = new Set<string>()
    const expenses: ProcessedExpense[] = []
    let skippedDuplicates = 0
    let autoAssigned = 0
    const newCategoryRules: { keyword: string; category: string }[] = []
    // Clone para permitir mutação local ao adicionar novas regras de categoria
    const activeCategoryRules = [...categoryRules]

    for (const parsed of parsedTransactions) {
      // 1. Verificar duplicidade
      const parsedDateVal = new Date(parsed.date).getTime()

      const isDuplicate = this.findDuplicate(
        parsed,
        parsedDateVal,
        existingExpenses,
        matchedIds
      )

      if (isDuplicate) {
        skippedDuplicates++
        continue
      }

      // 2. Aplicar regras de atribuição automática
      const descLower = parsed.description.toLowerCase()
      const matchedRule = assignmentRules.find(r =>
        descLower.includes(r.keyword.toLowerCase())
      )

      // 3. Aplicar regras de categorização
      const matchedCategoryRule = activeCategoryRules.find(r =>
        descLower.includes(r.keyword.toLowerCase())
      )
      let finalCategory = matchedCategoryRule
        ? matchedCategoryRule.category
        : (parsed.category || 'Outros')

      // 4. Criar nova regra de categoria se a IA sugeriu uma e não existe
      if (!matchedCategoryRule && parsed.category && parsed.category !== 'Outros') {
        const newKeyword = parsed.description.split(' ')[0].toLowerCase()
        if (newKeyword.length > 2) {
          // Verificar se já não existe essa keyword nas regras ativas
          const alreadyExists = activeCategoryRules.some(
            r => r.keyword.toLowerCase() === newKeyword
          )
          if (!alreadyExists) {
            newCategoryRules.push({ keyword: newKeyword, category: parsed.category })
            activeCategoryRules.push({
              id: '',
              keyword: newKeyword,
              category: parsed.category,
              userId,
            })
          }
        }
      }

      // 5. Determinar sharedStatus
      const sharedStatus = this.resolveSharedStatus(matchedRule)

      expenses.push({
        date: new Date(parsed.date),
        description: parsed.description,
        amount: parsed.amount,
        card: parsed.card,
        isManual: false,
        month: resolvedMonth,
        userId,
        personId: matchedRule ? matchedRule.personId : null,
        category: finalCategory,
        sharedStatus,
      })

      if (matchedRule) {
        autoAssigned++
      }
    }

    return { expenses, skippedDuplicates, autoAssigned, newCategoryRules }
  }

  /**
   * Verifica se uma transação parseada é duplicata de uma despesa existente.
   * Usa correspondência exata em data, descrição, valor e cartão.
   * Marca IDs já usados para evitar que duas transações idênticas no mesmo PDF
   * sejam ambas consideradas duplicatas de uma única despesa existente.
   */
  findDuplicate(
    parsed: ParsedTransaction,
    parsedDateVal: number,
    existingExpenses: ExistingExpense[],
    matchedIds: Set<string>
  ): boolean {
    return !!existingExpenses.find(existing => {
      if (matchedIds.has(existing.id)) return false

      const dateMatch = new Date(existing.date).getTime() === parsedDateVal
      
      const parsedDesc = parsed.description.trim().toLowerCase()
      const descMatch =
        existing.description.trim().toLowerCase() === parsedDesc ||
        (existing.originalDescription && existing.originalDescription.trim().toLowerCase() === parsedDesc)

      const amountMatch = 
        Math.abs(existing.amount - parsed.amount) < 0.001 ||
        (existing.originalAmount != null && Math.abs(existing.originalAmount - parsed.amount) < 0.001)

      const cardMatch = existing.card === parsed.card

      if (dateMatch && descMatch && amountMatch && cardMatch) {
        matchedIds.add(existing.id)
        return true
      }
      return false
    })
  }

  /**
   * Determina o sharedStatus da despesa com base na regra de atribuição.
   * - Se não há regra (personId será null), fica ACCEPTED (pendente de atribuição manual)
   * - Se a pessoa vinculada tem conta no sistema e está linkada, fica PENDING
   * - Caso contrário, fica ACCEPTED (membro local)
   */
  resolveSharedStatus(matchedRule: AssignmentRuleWithPerson | undefined): string {
    if (
      matchedRule &&
      matchedRule.person &&
      matchedRule.person.linkedUserId &&
      matchedRule.person.linkStatus === 'ACCEPTED'
    ) {
      return 'PENDING'
    }
    return 'ACCEPTED'
  }
}
