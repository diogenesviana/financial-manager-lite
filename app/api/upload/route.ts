import { NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
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

    // Detectar a instituição financeira a partir do texto do PDF
    let institution = 'Desconhecida'
    const textLower = text.toLowerCase()
    if (textLower.includes('nubank') || textLower.includes('nu pagamentos') || textLower.includes('nupay')) {
      institution = 'Nubank'
    } else if (textLower.includes('itaú') || textLower.includes('itau')) {
      institution = 'Itaú'
    } else if (textLower.includes('bradesco')) {
      institution = 'Bradesco'
    } else if (textLower.includes('santander')) {
      institution = 'Santander'
    } else if (textLower.includes('inter')) {
      institution = 'Banco Inter'
    } else if (textLower.includes('c6')) {
      institution = 'C6 Bank'
    }

    // Regex para capturar transações típicas de cartões brasileiros
    // Exemplo: 10/05 MERCADO LIVRE 150,00
    // Ou: 10 MAI IFOOD 45,90
    const lines = text.split('\n')
    const expenses: any[] = []

    const parseDateString = (dateStr: string, monthRef: string) => {
      // monthRef is YYYY-MM
      const year = parseInt(monthRef.split('-')[0]) || new Date().getFullYear()
      const refMonth = parseInt(monthRef.split('-')[1]) || (new Date().getMonth() + 1)
      
      let day = 1
      let month = refMonth

      if (dateStr.includes('/')) {
        const parts = dateStr.split('/')
        day = parseInt(parts[0])
        month = parseInt(parts[1])
      } else {
        const parts = dateStr.split(' ')
        day = parseInt(parts[0])
        const monthNames = { 'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6, 'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12 }
        const mKey = parts[1].toLowerCase().substring(0, 3) as keyof typeof monthNames
        month = monthNames[mKey] || refMonth
      }

      // Convert to Date object
      // Month is 0-indexed in JS Date
      const d = new Date(year, month - 1, day, 12, 0, 0, 0)
      return d.toISOString()
    }

    // Regex 1: DD/MM DESCRIÇÃO VALOR
    const regex1 = /(\d{2}\/\d{2})\s+(.+?)\s+([\d.,]+)$|([\d.,]+)\s+(.+?)\s+(\d{2}\/\d{2})/gm
    
    // Lógica melhorada para extrair transações
    const isPayment = (desc: string) => {
      const dLower = desc.toLowerCase()
      return dLower.includes('pagamento') || dLower.includes('recebido')
    }

    const isRefund = (desc: string, line: string) => {
      const dLower = desc.toLowerCase()
      const lLower = line.toLowerCase()
      return (
        dLower.includes('estorno') ||
        dLower.includes('reembolso') ||
        line.includes('−') || // Unicode minus sign
        lLower.includes('-r$') ||
        lLower.includes('−r$')
      )
    }

    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Procura por data DD/MM ou DD MMM no início da linha
      const dateMatch = trimmedLine.match(/^(\d{2}\/\d{2})|^(\d{2}\s+[A-Z]{3})/i)
      
      // Procura por valor no final da linha (formato brasileiro: 1.234,56 ou 34,56)
      const amountMatch = trimmedLine.match(/([\d.]+,[\d]{2})$/)
      
      if (dateMatch && amountMatch) {
        const date = dateMatch[0]
        const amountStr = amountMatch[1].replace(/\./g, '').replace(',', '.')
        const parsedAmount = parseFloat(amountStr)
        
        // A descrição é o que sobra entre a data e o valor
        let description = trimmedLine.substring(date.length, trimmedLine.length - amountMatch[0].length).trim()
        
        // Remove espaços duplos e caracteres estranhos
        description = description.replace(/\s+/g, ' ')

        // Extrai o cartão e remove os pontos bullet do Nubank
        let card = null
        const cardMatch = description.match(/(?:•|\*|\s)+(\d{4})/)
        if (cardMatch) {
          card = cardMatch[1]
          // Limpa a descrição removendo os pontos e os dígitos
          description = description.replace(/(?:•|\*|\s)+\d{4}/g, '').trim()
        }

        // Limpa o final da descrição (remove "R$", "-R$", etc.)
        description = description.replace(/\s*[−-]?R\$\s*$/i, '').trim()

        // Ignora pagamentos de fatura
        if (isPayment(description)) {
          continue
        }

        // Se for estorno/crédito, converte para valor negativo
        let amount = parsedAmount
        if (isRefund(description, trimmedLine)) {
          amount = -Math.abs(parsedAmount)
        }
 
        if (!isNaN(amount) && description && amount !== 0) {
          expenses.push({
            date: parseDateString(date, month),
            description,
            amount,
            card: institution,
            isManual: false
          })
        }
      }
    }
 
    // Se não encontrou nada com a lógica simples, tenta uma regex mais agressiva
    if (expenses.length === 0) {
        // Tenta capturar qualquer linha que tenha uma data e um valor monetário no formato brasileiro
        const genericRegex = /(\d{2}\/\d{2})\s+(.*?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g
        let match;
        while ((match = genericRegex.exec(text)) !== null) {
            const description = match[2].trim()
            const fullLine = match[0]
            
            if (isPayment(description)) {
              continue
            }

            let cleanedDescription = description.replace(/\s+/g, ' ')
            
            let card = null
            const cardMatch = cleanedDescription.match(/(?:•|\*|\s)+(\d{4})/)
            if (cardMatch) {
              card = cardMatch[1]
              cleanedDescription = cleanedDescription.replace(/(?:•|\*|\s)+\d{4}/g, '').trim()
            }
            cleanedDescription = cleanedDescription.replace(/\s*[−-]?R\$\s*$/i, '').trim()

            const parsedAmount = parseFloat(match[3].replace('.', '').replace(',', '.'))
            let amount = parsedAmount
            if (isRefund(cleanedDescription, fullLine)) {
              amount = -Math.abs(parsedAmount)
            }

            expenses.push({
                date: parseDateString(match[1], month),
                description: cleanedDescription,
                amount,
                card: institution,
                isManual: false
            })
        }
    }

    // Filtra transações duplicadas
    let uniqueExpensesToCreate = [...expenses]
    let skippedDuplicatesCount = 0

    if (expenses.length > 0) {
      const existingExpenses = await prisma.expense.findMany({
        where: { month }
      })

      const matchedIds = new Set<string>()
      uniqueExpensesToCreate = []

      for (const parsed of expenses) {
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
          uniqueExpensesToCreate.push(parsed)
        }
      }
    }

    // Salva no banco de dados
    if (uniqueExpensesToCreate.length > 0) {
      await prisma.expense.createMany({
        data: uniqueExpensesToCreate.map(e => ({
          ...e,
          month
        }))
      })

      // Aplica regras de atribuição automática
      const rules = await prisma.assignmentRule.findMany()
      if (rules.length > 0) {
        const recentExpenses = await prisma.expense.findMany({
          where: { month, personId: null },
        })

        let autoAssigned = 0
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

        const dupInfo = skippedDuplicatesCount > 0 ? ` (${skippedDuplicatesCount} duplicadas ignoradas)` : ''
        return NextResponse.json({ 
          success: true, 
          count: uniqueExpensesToCreate.length,
          autoAssigned,
          message: `${uniqueExpensesToCreate.length} despesas extraídas${dupInfo}. ${autoAssigned > 0 ? `${autoAssigned} atribuída(s) automaticamente.` : ''}` 
        })
      }
    }

    const dupInfo = skippedDuplicatesCount > 0 ? ` (${skippedDuplicatesCount} duplicadas ignoradas)` : ''
    return NextResponse.json({ 
      success: true, 
      count: uniqueExpensesToCreate.length,
      message: `${uniqueExpensesToCreate.length} despesas extraídas com sucesso${dupInfo}.` 
    })
  } catch (error: any) {
    console.error('Erro ao processar PDF:', error)
    return NextResponse.json({ error: 'Erro ao processar PDF: ' + error.message }, { status: 500 })
  }
}
