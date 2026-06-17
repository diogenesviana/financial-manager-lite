import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { GeminiParserService } from '@/adapters/ai/GeminiParserService'
import { getCurrentUser } from '@/lib/auth'

// Força o Next.js/Vercel a incluir o worker do PDFJS no pacote de produção
import 'pdfjs-dist/legacy/build/pdf.worker.mjs'

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

    const pdfStart = performance.now()
    // Polyfill DOMMatrix for pdf-parse/pdfjs-dist
    if (typeof (global as any).DOMMatrix === 'undefined') {
      (global as any).DOMMatrix = class DOMMatrix {
        constructor() {}
      };
    }

    // Import dynamically so polyfill runs beforehand
    const { PDFParse } = await import('pdf-parse')

    const buffer = Buffer.from(await file.arrayBuffer())
    const parser = new PDFParse({ data: buffer })
    const data = await parser.getText()
    const text = data.text
    const pdfDuration = ((performance.now() - pdfStart) / 1000).toFixed(2)
    console.log(`[Upload Timer] Extração de texto do PDF levou: ${pdfDuration}s`)

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Não foi possível extrair texto do PDF' }, { status: 400 })
    }

    const geminiParser = new GeminiParserService()
    const detectedMonth = month || geminiParser.detectMonthFromText(text)
    console.log(`[Upload] Mês de partida: ${detectedMonth}`)

    // Chamada ao serviço de interpretação por IA (Gemini)
    let parsedExpenses: any[] = []
    let resolvedMonth = detectedMonth
    const aiStart = performance.now()
    try {
      const parseResult = await geminiParser.parseInvoiceText(text, detectedMonth)
      parsedExpenses = parseResult.transactions
      resolvedMonth = parseResult.resolvedMonth || detectedMonth
      const aiDuration = ((performance.now() - aiStart) / 1000).toFixed(2)
      console.log(`[Upload Timer] Chamada de IA (Gemini) levou: ${aiDuration}s. Mês resolvido: ${resolvedMonth}`)
    } catch (aiError: any) {
      console.error('AI PARSER ERROR:', aiError)
      return NextResponse.json({ error: aiError.message }, { status: 502 })
    }

    const dbStart = performance.now()
    // Buscar regras automáticas de atribuição do usuário de antemão
    const rules = await prisma.assignmentRule.findMany({
      where: { userId: user.id }
    })
    
    const categoryRules = await prisma.categoryRule.findMany({
      where: { userId: user.id }
    })

    // Filtrar transações duplicadas do usuário logado
    const existingExpenses = await prisma.expense.findMany({
      where: { userId: user.id, month: resolvedMonth, deletedAt: null }
    })

    const matchedIds = new Set<string>()
    const uniqueExpensesToCreate: any[] = []
    let skippedDuplicatesCount = 0
    let autoAssigned = 0

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
        // Realizar a correspondência de regras em memória
        const descLower = parsed.description.toLowerCase()
        const matchedRule = rules.find(r => descLower.includes(r.keyword.toLowerCase()))
        
        const matchedCategoryRule = categoryRules.find(r => descLower.includes(r.keyword.toLowerCase()))
        let finalCategory = matchedCategoryRule ? matchedCategoryRule.category : (parsed.category || 'Outros')
        
        if (!matchedCategoryRule && parsed.category && parsed.category !== 'Outros') {
          const newKeyword = parsed.description.split(' ')[0].toLowerCase()
          if (newKeyword.length > 2) {
            try {
              await prisma.categoryRule.create({
                data: {
                  keyword: newKeyword,
                  category: parsed.category,
                  userId: user.id
                }
              })
              categoryRules.push({ id: '', keyword: newKeyword, category: parsed.category, userId: user.id, createdAt: new Date() })
            } catch (e) {}
          }
        }

        uniqueExpensesToCreate.push({
          date: new Date(parsed.date),
          description: parsed.description,
          amount: parsed.amount,
          card: parsed.card,
          isManual: false,
          month: resolvedMonth,
          userId: user.id,
          personId: matchedRule ? matchedRule.personId : null,
          category: finalCategory
        })

        if (matchedRule) {
          autoAssigned++
        }
      }
    }

    // Salvar despesas únicas no banco com uma única transação
    if (uniqueExpensesToCreate.length > 0) {
      await prisma.expense.createMany({
        data: uniqueExpensesToCreate
      })
    }
    const dbDuration = ((performance.now() - dbStart) / 1000).toFixed(2)
    console.log(`[Upload Timer] Processamento de banco de dados levou: ${dbDuration}s`)

    if (uniqueExpensesToCreate.length > 0) {
      const dupInfo = skippedDuplicatesCount > 0 ? ` (${skippedDuplicatesCount} duplicadas ignoradas)` : ''
      return NextResponse.json({ 
        success: true, 
        count: uniqueExpensesToCreate.length,
        autoAssigned,
        month: resolvedMonth,
        message: `${uniqueExpensesToCreate.length} despesas extraídas${dupInfo}. ${autoAssigned > 0 ? `${autoAssigned} atribuída(s) automaticamente.` : ''}` 
      })
    }

    const dupInfo = skippedDuplicatesCount > 0 ? ` (${skippedDuplicatesCount} duplicadas ignoradas)` : ''
    return NextResponse.json({ 
      success: true, 
      count: 0,
      month: resolvedMonth,
      message: `Nenhuma nova despesa extraída${dupInfo}.` 
    })
  } catch (error: any) {
    console.error('Erro ao processar PDF:', error)
    
    const isPasswordError = 
      error.name === 'PasswordException' || 
      error.message?.toLowerCase().includes('password') ||
      error.message?.toLowerCase().includes('senha') ||
      error.message?.toLowerCase().includes('decrypt') ||
      error.message?.toLowerCase().includes('encrypted')
      
    if (isPasswordError) {
      return NextResponse.json({ 
        error: 'Este arquivo PDF está protegido por senha. Por favor, salve uma cópia sem senha (abra o PDF, selecione "Imprimir" -> "Salvar como PDF") e envie novamente.' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erro ao processar PDF: ' + error.message }, { status: 500 })
  }
}
