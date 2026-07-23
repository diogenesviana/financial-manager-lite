import { PersonRepository } from '../domain/ports/PersonRepository';
import { UserRepository } from '../domain/ports/UserRepository';
import { ExpenseRepository } from '../domain/ports/ExpenseRepository';
import { SyncSelfPersonUseCase } from './SyncSelfPerson';

export interface ListPeopleResult {
  id: string;
  name: string;
  userId: string;
  phone: string | null;
  avatar: string | null;
  linkedUserId: string | null;
  linkStatus?: string;
  inviteEmail?: string | null;
  createdAt: Date;
  monthlyTotal: number;
  prevMonthlyTotal: number;
  diff: number;
}

export class ListPeople {
  constructor(
    private personRepo: PersonRepository,
    private userRepo: UserRepository,
    private expenseRepo: ExpenseRepository,
    private syncSelfPersonUseCase: SyncSelfPersonUseCase
  ) {}

  async execute(userId: string, month: string | null): Promise<ListPeopleResult[]> {
    const dbUser = await this.userRepo.findById(userId);
    if (dbUser) {
      await this.syncSelfPersonUseCase.execute({
        userId,
        userName: dbUser.name,
        userPhone: dbUser.phone || null,
        userEmail: dbUser.email,
        userAvatar: dbUser.avatar || null
      });
    }

    let monthlyTotals: Record<string, number> = {};
    let prevMonthlyTotals: Record<string, number> = {};

    if (month === 'last30') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const expenses = await this.expenseRepo.findByUserAndMonth(userId, 'all');
      const activeExpenses = expenses.filter(e => e.date >= thirtyDaysAgo);
      activeExpenses.forEach(e => {
        if (e.personId) {
          monthlyTotals[e.personId] = (monthlyTotals[e.personId] || 0) + e.amount;
        }
      });
    } else if (month && month !== 'all') {
      const currentExpenses = await this.expenseRepo.findByUserAndMonth(userId, month);
      currentExpenses.forEach(e => {
        if (e.personId) {
          monthlyTotals[e.personId] = (monthlyTotals[e.personId] || 0) + e.amount;
        }
      });

      const [year, mVal] = month.split('-').map(Number);
      let prevYear = year;
      let prevMonthVal = mVal - 1;
      if (prevMonthVal === 0) {
        prevMonthVal = 12;
        prevYear = year - 1;
      }
      const prevMonth = `${prevYear}-${String(prevMonthVal).padStart(2, '0')}`;
      const prevExpenses = await this.expenseRepo.findByUserAndMonth(userId, prevMonth);
      prevExpenses.forEach(e => {
        if (e.personId) {
          prevMonthlyTotals[e.personId] = (prevMonthlyTotals[e.personId] || 0) + e.amount;
        }
      });
    } else {
      const expenses = await this.expenseRepo.findByUserAndMonth(userId, 'all');
      expenses.forEach(e => {
        if (e.personId) {
          monthlyTotals[e.personId] = (monthlyTotals[e.personId] || 0) + e.amount;
        }
      });
    }

    const people = await this.personRepo.findByUser(userId);

    const mapped = people.map(p => {
      const total = monthlyTotals[p.id] || 0;
      const prevTotal = prevMonthlyTotals[p.id] || 0;
      const diff = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

      return {
        id: p.id,
        name: p.name,
        userId: p.userId,
        phone: p.linkedUser?.phone || p.phone || null,
        avatar: p.linkedUser?.avatar || p.avatar || null,
        linkedUserId: p.linkedUserId || null,
        linkStatus: p.linkStatus,
        inviteEmail: p.inviteEmail || null,
        createdAt: p.createdAt,
        monthlyTotal: total,
        prevMonthlyTotal: prevTotal,
        diff
      };
    }).sort((a, b) => {
      const isSelfA = a.linkedUserId === userId ? 1 : 0;
      const isSelfB = b.linkedUserId === userId ? 1 : 0;
      return isSelfB - isSelfA;
    });

    return mapped;
  }
}
