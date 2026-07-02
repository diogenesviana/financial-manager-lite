import prisma from '@/lib/prisma'

export interface SyncCategoryChange {
  id: string
  description: string
  month: string
  amount: number
  oldCategory: string
  newCategory: string
}

export interface SyncCategoryRulesResult {
  success: boolean
  dryRun: boolean
  totalRules: number
  totalExpenses: number
  updatedCount: number
  changes: SyncCategoryChange[]
}

/**
 * Use Case para sincronizar retroativamente categorias de despesas
 * com base nas regras de categorias personalizadas ativas.
 * Pode ser executado em modo de simulação (dryRun) e filtrado por usuário.
 */
export class SyncCategoryRules {
  async execute(targetUserId?: string, dryRun: boolean = true): Promise<SyncCategoryRulesResult> {
    // 1. Filtrar regras de categoria
    const rulesWhere: any = {}
    if (targetUserId) {
      rulesWhere.userId = targetUserId
    }
    const rules = await prisma.categoryRule.findMany({
      where: rulesWhere
    })
    
    // 2. Filtrar despesas ativas (não deletadas)
    const expensesWhere: any = { deletedAt: null }
    if (targetUserId) {
      expensesWhere.userId = targetUserId
    }
    const expenses = await prisma.expense.findMany({
      where: expensesWhere
    })
    
    const changes: SyncCategoryChange[] = []
    let updatedCount = 0

    // 3. Iterar e verificar/atualizar
    for (const expense of expenses) {
      // Filtrar apenas regras do mesmo proprietário da despesa
      const userRules = rules.filter(r => r.userId === expense.userId)

      // Tentar bater pela descrição original primeiro (prioritária)
      const originalDesc = (expense.originalDescription || '').toLowerCase()
      const friendlyDesc = (expense.description || '').toLowerCase()

      let matchedRule = originalDesc
        ? userRules.find(r => originalDesc.includes(r.keyword.toLowerCase()))
        : undefined

      // Fallback: se nenhuma regra bateu pela descrição original, tentar pela editada
      if (!matchedRule) {
        matchedRule = userRules.find(r => friendlyDesc.includes(r.keyword.toLowerCase()))
      }

      if (matchedRule) {
        const newCategory = matchedRule.category

        // Se a categoria atual diferir da categoria sugerida pela regra
        if (expense.category !== newCategory) {
          changes.push({
            id: expense.id,
            description: expense.description,
            month: expense.month,
            amount: expense.amount,
            oldCategory: expense.category || 'Outros',
            newCategory
          })

          if (!dryRun) {
            await prisma.expense.update({
              where: { id: expense.id },
              data: { category: newCategory }
            })
            updatedCount++
          }
        }
      }
    }

    changes.sort((a, b) => b.month.localeCompare(a.month))

    return {
      success: true,
      dryRun,
      totalRules: rules.length,
      totalExpenses: expenses.length,
      updatedCount: dryRun ? changes.length : updatedCount,
      changes
    }
  }
}
