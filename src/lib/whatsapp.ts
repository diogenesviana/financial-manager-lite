interface ExpenseItem {
  date: string | Date
  description: string
  amount: number
}

export class WhatsAppService {
  /**
   * Formata o número de telefone para o padrão internacional do WhatsApp.
   * Remove caracteres não numéricos. Se tiver 10 ou 11 dígitos, assume código do Brasil (55).
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10 || cleaned.length === 11) {
      return `55${cleaned}`
    }
    return cleaned
  }

  /**
   * Compila a mensagem e abre o WhatsApp Web/App com a mensagem pré-preenchida.
   */
  static sendBillSummary(params: {
    phone: string
    personName: string
    month: string
    expenses: ExpenseItem[]
    totalAmount: number
  }) {
    const { phone, personName, month, expenses, totalAmount } = params
    const formattedPhone = this.formatPhoneNumber(phone)

    // Formatar a lista de despesas (sem data)
    const expensesListText = expenses
      .map(exp => {
        const formattedAmount = exp.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        return `- ${exp.description}: *${formattedAmount}*`
      })
      .join('\n')

    const formattedTotal = totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    // Montar a mensagem completa com formatação do WhatsApp (negrito, emojis)
    const message = `Olá, *${personName}*! 👋

Aqui está o resumo das suas despesas para a fatura de *${month}*:

${expensesListText}

----------------------------------
💰 *Valor Total Devido: ${formattedTotal}*

Por favor, faça o acerto assim que puder. Obrigado! 😊

🤖 _Mensagem enviada automaticamente via Financial Manager Lite_`

    // Gerar o link oficial do WhatsApp
    const encodedText = encodeURIComponent(message)
    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`

    // Abrir o link em uma nova guia
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
