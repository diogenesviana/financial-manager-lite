import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { GeminiParserService } from '@/adapters/ai/GeminiParserService'
import { getCurrentUser } from '@/lib/auth'
import { ProcessInvoice } from '@/core/use-cases/ProcessInvoice'
import { IntegrationLogger } from '@/core/domain/services/IntegrationLogger'

// Força o Next.js/Vercel a incluir o worker do PDFJS no pacote de produção
import 'pdfjs-dist/legacy/build/pdf.worker.mjs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let password = ''
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const month = (formData.get('month') as string) || ''
    password = (formData.get('password') as string) || ''
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const isCsv = file.name.toLowerCase().endsWith('.csv')
    const buffer = Buffer.from(await file.arrayBuffer())
    
    let text = ''
    const pdfStart = performance.now()

    if (isCsv) {
      // Leitura direta do CSV como texto puro (decodificando UTF-8)
      text = buffer.toString('utf8')
      const parseDuration = ((performance.now() - pdfStart) / 1000).toFixed(2)
      console.log(`[Upload Timer] Leitura do CSV nativa levou: ${parseDuration}s`)
    } else {
      // Processamento do PDF
      if (typeof (global as any).DOMMatrix === 'undefined') {
        (global as any).DOMMatrix = class DOMMatrix {
          constructor() {}
        };
      }
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: buffer, password })
      const data = await parser.getText()
      text = data.text
      const pdfDuration = ((performance.now() - pdfStart) / 1000).toFixed(2)
      console.log(`[Upload Timer] Extração de texto do PDF levou: ${pdfDuration}s`)
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Não foi possível extrair texto do arquivo' }, { status: 400 })
    }

    const geminiParser = new GeminiParserService()
    const detectedMonth = month || geminiParser.detectMonthFromText(text)
    console.log(`[Upload] Mês de partida: ${detectedMonth}`)

    // Chamada ao serviço de interpretação por IA (Gemini)
    let parsedExpenses: any[] = []
    let resolvedMonth = detectedMonth
    try {
      const parseResult = await IntegrationLogger.run({
        serviceName: 'Gemini',
        operation: 'parseInvoiceText',
        userId: user.id,
        requestData: { textLength: text.length, referenceMonth: detectedMonth }
      }, async () => {
        return await geminiParser.parseInvoiceText(text, detectedMonth)
      })
      parsedExpenses = parseResult.transactions
      resolvedMonth = parseResult.resolvedMonth || detectedMonth
    } catch (aiError: any) {
      console.error('AI PARSER ERROR:', aiError)
      return NextResponse.json({ error: aiError.message }, { status: 502 })
    }

    const dbStart = performance.now()
    // Buscar regras automáticas de atribuição do usuário de antemão
    const rules = await prisma.assignmentRule.findMany({
      where: { userId: user.id },
      include: { person: true }
    })
    
    const categoryRules = await prisma.categoryRule.findMany({
      where: { userId: user.id }
    })

    // Filtrar transações duplicadas do usuário logado no mês ativo
    const existingExpenses = await prisma.expense.findMany({
      where: { userId: user.id, month: resolvedMonth, deletedAt: null }
    })

    // Usar o use case de processamento de faturas
    const processInvoice = new ProcessInvoice()
    const result = processInvoice.execute(
      parsedExpenses,
      existingExpenses,
      rules as any,
      categoryRules,
      resolvedMonth,
      user.id
    )

    // Persistir novas regras de categoria descobertas pela IA
    for (const newRule of result.newCategoryRules) {
      try {
        await prisma.categoryRule.create({
          data: {
            keyword: newRule.keyword,
            category: newRule.category,
            userId: user.id
          }
        })
      } catch (e) {}
    }

    // Salvar despesas únicas no banco com uma única transação
    if (result.expenses.length > 0) {
      await prisma.expense.createMany({
        data: result.expenses
      })
    }
    const dbDuration = ((performance.now() - dbStart) / 1000).toFixed(2)
    console.log(`[Upload Timer] Processamento de banco de dados levou: ${dbDuration}s`)

    if (result.expenses.length > 0) {
      const dupInfo = result.skippedDuplicates > 0 ? ` (${result.skippedDuplicates} duplicadas ignoradas)` : ''
      return NextResponse.json({ 
        success: true, 
        count: result.expenses.length,
        autoAssigned: result.autoAssigned,
        month: resolvedMonth,
        message: `${result.expenses.length} despesas extraídas${dupInfo}. ${result.autoAssigned > 0 ? `${result.autoAssigned} atribuída(s) automaticamente.` : ''}` 
      })
    }

    const dupInfo = result.skippedDuplicates > 0 ? ` (${result.skippedDuplicates} duplicadas ignoradas)` : ''
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
      if (password) {
        return NextResponse.json({ 
          error: 'Senha incorreta. Por favor, tente novamente.', 
          code: 'WRONG_PASSWORD'
        }, { status: 400 })
      }
      return NextResponse.json({ 
        error: 'Este arquivo PDF está protegido por senha.', 
        code: 'PASSWORD_REQUIRED'
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erro ao processar PDF: ' + error.message }, { status: 500 })
  }
}
