import { NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'
import prisma from '@/lib/prisma'
import { GeminiParserService } from '@/adapters/ai/GeminiParserService'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const month = (formData.get('month') as string) || ''
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parser = new PDFParse({ data: buffer })
    const data = await parser.getText()
    const text = data.text

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Não foi possível extrair texto do PDF' }, { status: 400 })
    }

    // Chamada ao serviço de interpretação por IA (Gemini)
    let parsedExpenses = []
    try {
      const geminiParser = new GeminiParserService()
      parsedExpenses = await geminiParser.parseInvoiceText(text, month)
    } catch (aiError: any) {
      console.error('AI PARSER ERROR:', aiError)
      return NextResponse.json({ error: aiError.message }, { status: 502 })
    }

    // Filtrar transações duplicadas do usuário logado
    const existingExpenses = await prisma.expense.findMany({
      where: { userId: user.id, month }
    })

    const matchedIds = new Set<string>()
    const uniqueExpensesToCreate: any[] = []
    let skippedDuplicatesCount = 0

    for (const parsed of parsedExpenses) {
      const parsedDateVal = new Date(parsed.date).getTime()
      
      const isDuplicate = existingExpenses.find(existing => {
        if (matchedIds.has(existing.id)) return false
        
        const dateMatch = new Date(existing.date).getTime() === parsedDateVal
        const descMatch = existing.description.trim().toLowerCase() === parsed.description.trim().toLowerCase()
        const amountMatch = Math.abs(existing.amount - parsed.amount) < 0.001
        const cardMatch = existing.card === parsed.card
        
        if (dateMatch && descMatch && amountMatch && cardMatch) {
          matchedIds.add(existing.id)
          return true
        }
        return false
      })

      if (isDuplicate) {
        skippedDuplicatesCount++
      } else {
        uniqueExpensesToCreate.push({
          date: new Date(parsed.date),
          description: parsed.description,
          amount: parsed.amount,
          card: parsed.card,
          isManual: false,
          month,
          userId: user.id
        })
      }
    }

    // Salvar despesas únicas no banco
    if (uniqueExpensesToCreate.length > 0) {
      await prisma.expense.createMany({
        data: uniqueExpensesToCreate
      })

      // Buscar despesas recém-criadas que ainda não têm pessoa atribuída
      const recentExpenses = await prisma.expense.findMany({
        where: { userId: user.id, month, personId: null },
      })

      // Buscar regras automáticas de atribuição do usuário
      const rules = await prisma.assignmentRule.findMany({
        where: { userId: user.id }
      })

      let autoAssigned = 0
      if (rules.length > 0 && recentExpenses.length > 0) {
        for (const expense of recentExpenses) {
          const descLower = expense.description.toLowerCase()
          const matchedRule = rules.find(r => descLower.includes(r.keyword.toLowerCase()))
          if (matchedRule) {
            await prisma.expense.update({
              where: { id: expense.id },
              data: { personId: matchedRule.personId },
            })
            autoAssigned++
          }
        }
      }

      const dupInfo = skippedDuplicatesCount > 0 ? ` (${skippedDuplicatesCount} duplicadas ignoradas)` : ''
      return NextResponse.json({ 
        success: true, 
        count: uniqueExpensesToCreate.length,
        autoAssigned,
        message: `${uniqueExpensesToCreate.length} despesas extraídas${dupInfo}. ${autoAssigned > 0 ? `${autoAssigned} atribuída(s) automaticamente.` : ''}` 
      })
    }

    const dupInfo = skippedDuplicatesCount > 0 ? ` (${skippedDuplicatesCount} duplicadas ignoradas)` : ''
    return NextResponse.json({ 
      success: true, 
      count: 0,
      message: `Nenhuma nova despesa extraída${dupInfo}.` 
    })
  } catch (error: any) {
    console.error('Erro ao processar PDF:', error)
    return NextResponse.json({ error: 'Erro ao processar PDF: ' + error.message }, { status: 500 })
  }
}
