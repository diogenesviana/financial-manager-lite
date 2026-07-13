export interface DashboardData {
  people: any[]
  expenses: any[]
  prevExpenses: any[]
  months: string[]
  paymentsMap: Record<string, boolean>
  user?: any
}

export interface ImportData {
  people: any[]
  expenses: any[]
}

export interface RulesData {
  people: any[]
  rules: any[]
  categoryRules: any[]
}

const getPreviousMonthStr = (monthStr: string) => {
  const [year, month] = monthStr.split('-').map(Number)
  let prevYear = year
  let prevMonth = month - 1
  if (prevMonth === 0) {
    prevMonth = 12
    prevYear = year - 1
  }
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`
}

export const fetchDashboardData = async (targetMonth: string): Promise<DashboardData> => {
  const t = Date.now()
  const prevMonthStr = getPreviousMonthStr(targetMonth)

  const [peopleRes, expensesRes, prevExpensesRes, monthsRes, paymentsRes, userRes] = await Promise.all([
    fetch(`/api/people?t=${t}`),
    fetch(`/api/expenses?month=${targetMonth}&t=${t}`),
    fetch(`/api/expenses?month=${prevMonthStr}&t=${t}`),
    fetch(`/api/expenses/months?t=${t}`),
    fetch(`/api/people/payments?month=${targetMonth}&t=${t}`),
    fetch(`/api/auth/me?t=${t}`)
  ])

  const peopleData = await peopleRes.json()
  const expensesData = await expensesRes.json()
  const prevExpensesData = prevExpensesRes.ok ? await prevExpensesRes.json() : []
  const monthsData = monthsRes.ok ? await monthsRes.json() : []
  const paymentsData = paymentsRes.ok ? await paymentsRes.json() : []
  
  let user
  if (userRes && userRes.ok) {
    const userData = await userRes.json()
    user = userData.user
  }

  const paymentsMap: Record<string, boolean> = {}
  if (Array.isArray(paymentsData)) {
    paymentsData.forEach(p => { paymentsMap[p.personId] = p.isPaid })
  }

  return {
    people: Array.isArray(peopleData) ? peopleData : [],
    expenses: Array.isArray(expensesData) ? expensesData : [],
    prevExpenses: Array.isArray(prevExpensesData) ? prevExpensesData : [],
    months: Array.isArray(monthsData) ? monthsData : [],
    paymentsMap,
    user
  }
}

export interface PeoplePageData {
  people: any[]
  months: string[]
  paymentsMap: Record<string, boolean>
  user?: any
}

export const fetchPeoplePageData = async (targetMonth: string): Promise<PeoplePageData> => {
  const t = Date.now()

  const [peopleRes, monthsRes, paymentsRes, userRes] = await Promise.all([
    fetch(`/api/people?month=${targetMonth}&t=${t}`),
    fetch(`/api/expenses/months?t=${t}`),
    fetch(`/api/people/payments?month=${targetMonth}&t=${t}`),
    fetch(`/api/auth/me?t=${t}`)
  ])

  const peopleData = await peopleRes.json()
  const monthsData = monthsRes.ok ? await monthsRes.json() : []
  const paymentsData = paymentsRes.ok ? await paymentsRes.json() : []
  
  let user
  if (userRes && userRes.ok) {
    const userData = await userRes.json()
    user = userData.user
  }

  const paymentsMap: Record<string, boolean> = {}
  if (Array.isArray(paymentsData)) {
    paymentsData.forEach(p => { paymentsMap[p.personId] = p.isPaid })
  }

  return {
    people: Array.isArray(peopleData) ? peopleData : [],
    months: Array.isArray(monthsData) ? monthsData : [],
    paymentsMap,
    user
  }
}

export const fetchImportPageData = async (targetMonth: string): Promise<ImportData> => {
  const t = Date.now()
  const [peopleRes, expensesRes] = await Promise.all([
    fetch(`/api/people?t=${t}`),
    fetch(`/api/expenses?month=${targetMonth}&t=${t}`)
  ])

  let people = []
  let expenses = []

  if (peopleRes.ok && expensesRes.ok) {
    const peopleData = await peopleRes.json()
    const expensesData = await expensesRes.json()
    people = Array.isArray(peopleData) ? peopleData : []
    expenses = Array.isArray(expensesData) ? expensesData : []
  }

  return { people, expenses }
}

export const fetchRulesData = async (): Promise<RulesData> => {
  const t = Date.now()
  const [peopleRes, rulesRes, categoryRulesRes] = await Promise.all([
    fetch(`/api/people?t=${t}`),
    fetch(`/api/rules?t=${t}`),
    fetch(`/api/category-rules?t=${t}`)
  ])

  let people = []
  let rules = []
  let categoryRules = []

  if (peopleRes.ok) {
    const peopleData = await peopleRes.json().catch(() => [])
    people = Array.isArray(peopleData) ? peopleData : []
  }
  if (rulesRes.ok) {
    const rulesData = await rulesRes.json().catch(() => [])
    rules = Array.isArray(rulesData) ? rulesData : []
  }
  if (categoryRulesRes.ok) {
    const categoryRulesData = await categoryRulesRes.json().catch(() => [])
    categoryRules = Array.isArray(categoryRulesData) ? categoryRulesData : []
  }

  return { people, rules, categoryRules }
}

export const fetchNotificationsCount = async (): Promise<number> => {
  const t = Date.now()
  const [resInvites, resNotifs] = await Promise.all([
    fetch(`/api/invites?t=${t}`),
    fetch(`/api/notifications?t=${t}`)
  ])

  let count = 0
  if (resInvites.ok) {
    const data = await resInvites.json()
    count += Array.isArray(data) ? data.filter((i: any) => i.linkStatus === 'PENDING').length : 0
  }
  if (resNotifs.ok) {
    const notifs = await resNotifs.json()
    count += Array.isArray(notifs) ? notifs.length : 0
  }

  return count
}
