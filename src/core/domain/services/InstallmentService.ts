export interface ParsedInstallment {
  current: number
  total: number
  matchedText: string
  originalRoot: string
}

/**
 * Serviço de domínio centralizador de regras de negócio de compras parceladas.
 * Fornece métodos utilitários para parsing, geração de descrições e projeções de datas.
 */
export class InstallmentService {
  private static installmentRegexes = [
    /parcela\s*(\d+)\s*de\s*(\d+)/i,
    /parcela\s*(\d+)\s*\/\s*(\d+)/i,
    /\b(\d+)\s*de\s*(\d+)\b/i,
    /\b(\d+)\s*\/\s*(\d+)\b/i
  ]

  /**
   * Analisa a descrição e identifica se é uma compra parcelada válida.
   * Em caso positivo, retorna os metadados do parcelamento.
   */
  static parseInstallment(description: string | null): ParsedInstallment | null {
    if (!description) return null

    for (const regex of this.installmentRegexes) {
      const match = description.match(regex)
      if (match) {
        const current = parseInt(match[1], 10)
        const total = parseInt(match[2], 10)
        const matchedText = match[0]

        if (
          current &&
          total &&
          total >= 2 &&
          total <= 120 &&
          current <= total
        ) {
          const index = description.indexOf(matchedText)
          const originalRoot = description.slice(0, index).trim()
          return { current, total, matchedText, originalRoot }
        }
      }
    }

    return null
  }

  /**
   * Gera a descrição de uma parcela específica (target) substituindo a menção original.
   * Preserva a formatação estética (ex: padding de zeros à esquerda).
   */
  static generateDescription(
    description: string,
    matchedText: string,
    target: number
  ): string {
    const index = description.indexOf(matchedText)
    if (index === -1) return description

    const digitsMatch = matchedText.match(/\d+/)
    if (!digitsMatch) return description

    const originalDigits = digitsMatch[0]
    const paddedTarget = String(target).padStart(originalDigits.length, '0')

    const replacedMatchedText = matchedText.replace(/\d+/, paddedTarget)
    return (
      description.slice(0, index) +
      replacedMatchedText +
      description.slice(index + matchedText.length)
    )
  }

  /**
   * Remove padrões de indicação de parcelamento de uma descrição para limpeza do texto.
   */
  static cleanInstallmentText(description: string): string {
    let clean = description
    for (const regex of this.installmentRegexes) {
      clean = clean.replace(regex, '')
    }
    return clean.replace(/\(\s*\)/, '').replace(/\s{2,}/g, ' ').trim()
  }

  /**
   * Projeta meses de referência (YYYY-MM) para parcelamentos retroativos ou futuros.
   */
  static addMonthsToMonthString(monthStr: string, diffMonths: number): string {
    const [yyyy, mm] = monthStr.split('-').map(Number)
    let targetMonth = mm + diffMonths
    let targetYear = yyyy
    
    while (targetMonth > 12) {
      targetMonth -= 12
      targetYear += 1
    }
    while (targetMonth < 1) {
      targetMonth += 12
      targetYear -= 1
    }
    
    const mmFormatted = String(targetMonth).padStart(2, '0')
    return `${targetYear}-${mmFormatted}`
  }
}
