import { PrismaUserRepository } from '@/adapters/db/PrismaUserRepository';
import { PrismaPersonRepository } from '@/adapters/db/PrismaPersonRepository';
import { PrismaExpenseRepository } from '@/adapters/db/PrismaExpenseRepository';
import { PrismaAssignmentRuleRepository } from '@/adapters/db/PrismaAssignmentRuleRepository';
import { PrismaCategoryRepository } from '@/adapters/db/PrismaCategoryRepository';
import { PrismaBankRepository } from '@/adapters/db/PrismaBankRepository';
import { PrismaNotificationRepository } from '@/adapters/db/PrismaNotificationRepository';
import { PrismaPaymentStatusRepository } from '@/adapters/db/PrismaPaymentStatusRepository';
import { PrismaCategoryRuleRepository } from '@/adapters/db/PrismaCategoryRuleRepository';
import { PrismaAuditLogRepository } from '@/adapters/db/PrismaAuditLogRepository';
import { PrismaIntegrationLogRepository } from '@/adapters/db/PrismaIntegrationLogRepository';
import { BcryptHasher } from '@/adapters/auth/BcryptHasher';
import { JoseTokenService } from '@/adapters/auth/JoseTokenService';
import { CnpjApiAdapter } from '@/adapters/cnpj/CnpjApiAdapter';

// New Use Cases
import { GetAuditLogs } from './use-cases/GetAuditLogs';
import { GetIntegrationLogs } from './use-cases/GetIntegrationLogs';
import { ListCategories } from './use-cases/ListCategories';
import { CreateCategory } from './use-cases/CreateCategory';
import { DeleteCategory } from './use-cases/DeleteCategory';
import { UpdateCategory } from './use-cases/UpdateCategory';
import { ListBanks } from './use-cases/ListBanks';
import { CreateBank } from './use-cases/CreateBank';
import { DeleteBank } from './use-cases/DeleteBank';
import { UpdateBank } from './use-cases/UpdateBank';
import { ListCategoryRules } from './use-cases/ListCategoryRules';
import { CreateCategoryRule } from './use-cases/CreateCategoryRule';
import { DeleteCategoryRule } from './use-cases/DeleteCategoryRule';
import { ListNotifications } from './use-cases/ListNotifications';
import { MarkNotificationsRead } from './use-cases/MarkNotificationsRead';
import { GetPaymentStatuses } from './use-cases/GetPaymentStatuses';
import { UpdatePaymentStatus } from './use-cases/UpdatePaymentStatus';
import { LookupCnpj } from './use-cases/LookupCnpj';
import { ClearUserData } from './use-cases/ClearUserData';
import { ListAssignmentRules } from './use-cases/ListAssignmentRules';
import { CreateAssignmentRule } from './use-cases/CreateAssignmentRule';
import { DeleteAssignmentRule } from './use-cases/DeleteAssignmentRule';
import { ListExpenses } from './use-cases/ListExpenses';
import { CreateExpense } from './use-cases/CreateExpense';
import { DeleteExpense } from './use-cases/DeleteExpense';
import { UpdateExpense } from './use-cases/UpdateExpense';
import { GetPendingInvites } from './use-cases/GetPendingInvites';
import { ListPeople } from './use-cases/ListPeople';
import { DeletePerson } from './use-cases/DeletePerson';
import { UpdatePerson } from './use-cases/UpdatePerson';
import { ClearExpenses } from './use-cases/ClearExpenses';
import { UploadInvoice } from './use-cases/UploadInvoice';
import { GetExpenseMonths } from './use-cases/GetExpenseMonths';
import { GetExpenseSuggestions } from './use-cases/GetExpenseSuggestions';
import { LookupUserForInvite } from './use-cases/LookupUserForInvite';
import { GetSharedExpenses } from './use-cases/GetSharedExpenses';
import { HandleSharedExpense } from './use-cases/HandleSharedExpense';
import { WipeSystem } from './use-cases/WipeSystem';
import { GetSessionProfile } from './use-cases/GetSessionProfile';
import { ChangePassword } from './use-cases/ChangePassword';
import { ResetUserPassword } from './use-cases/ResetUserPassword';
import { HandleGoogleCallback } from './use-cases/HandleGoogleCallback';

// Existing Use Cases
import { CreatePersonUseCase } from './use-cases/CreatePerson';
import { HandleInviteUseCase } from './use-cases/HandleInvite';
import { LoginUserUseCase } from './use-cases/LoginUser';
import { RegisterUserUseCase } from './use-cases/RegisterUser';
import { SearchExpensesUseCase } from './use-cases/SearchExpenses';
import { SyncCategoryRules } from './use-cases/SyncCategoryRules';
import { SyncSelfPersonUseCase } from './use-cases/SyncSelfPerson';
import { UpdateProfileUseCase } from './use-cases/UpdateProfile';
import { ManageUsersUseCase } from './use-cases/ManageUsers';
import { ProcessInvoice } from './use-cases/ProcessInvoice';

// Shared repository instances
const userRepo = new PrismaUserRepository();
const personRepo = new PrismaPersonRepository();
const expenseRepo = new PrismaExpenseRepository();
const ruleRepo = new PrismaAssignmentRuleRepository();
const categoryRepo = new PrismaCategoryRepository();
const bankRepo = new PrismaBankRepository();
const notificationRepo = new PrismaNotificationRepository();
const statusRepo = new PrismaPaymentStatusRepository();
const categoryRuleRepo = new PrismaCategoryRuleRepository();
const auditRepo = new PrismaAuditLogRepository();
const integrationRepo = new PrismaIntegrationLogRepository();

// Shared service adapters
const hasher = new BcryptHasher();
const tokenService = new JoseTokenService();
const cnpjService = new CnpjApiAdapter();

// Factories for use cases
export function makeGetAuditLogs() {
  return new GetAuditLogs(auditRepo);
}

export function makeGetIntegrationLogs() {
  return new GetIntegrationLogs(integrationRepo);
}

export function makeListCategories() {
  return new ListCategories(categoryRepo);
}

export function makeCreateCategory() {
  return new CreateCategory(categoryRepo);
}

export function makeDeleteCategory() {
  return new DeleteCategory(categoryRepo);
}

export function makeUpdateCategory() {
  return new UpdateCategory(categoryRepo);
}

export function makeListBanks() {
  return new ListBanks(bankRepo);
}

export function makeCreateBank() {
  return new CreateBank(bankRepo);
}

export function makeDeleteBank() {
  return new DeleteBank(bankRepo);
}

export function makeUpdateBank() {
  return new UpdateBank(bankRepo);
}

export function makeListCategoryRules() {
  return new ListCategoryRules(categoryRuleRepo);
}

export function makeCreateCategoryRule() {
  return new CreateCategoryRule(categoryRuleRepo);
}

export function makeDeleteCategoryRule() {
  return new DeleteCategoryRule(categoryRuleRepo);
}

export function makeListNotifications() {
  return new ListNotifications(notificationRepo);
}

export function makeMarkNotificationsRead() {
  return new MarkNotificationsRead(notificationRepo);
}

export function makeGetPaymentStatuses() {
  return new GetPaymentStatuses(statusRepo);
}

export function makeUpdatePaymentStatus() {
  return new UpdatePaymentStatus(statusRepo, personRepo, expenseRepo, notificationRepo);
}

export function makeListAssignmentRules() {
  return new ListAssignmentRules(ruleRepo);
}

export function makeCreateAssignmentRule() {
  return new CreateAssignmentRule(ruleRepo);
}

export function makeDeleteAssignmentRule() {
  return new DeleteAssignmentRule(ruleRepo);
}

export function makeLookupCnpj() {
  return new LookupCnpj(cnpjService);
}

export function makeClearUserData() {
  return new ClearUserData(expenseRepo, personRepo, ruleRepo);
}

export function makeListExpenses() {
  return new ListExpenses(expenseRepo);
}

export function makeCreateExpense() {
  return new CreateExpense(expenseRepo, personRepo, categoryRuleRepo);
}

export function makeDeleteExpense() {
  return new DeleteExpense(expenseRepo);
}

export function makeUpdateExpense() {
  return new UpdateExpense(expenseRepo, personRepo, notificationRepo, statusRepo, categoryRuleRepo);
}

// Factories for existing use cases
export function makeListPeople() {
  return new ListPeople(personRepo, userRepo, expenseRepo, makeSyncSelfPerson());
}

export function makeDeletePerson() {
  return new DeletePerson(personRepo, expenseRepo);
}

export function makeUpdatePerson() {
  return new UpdatePerson(personRepo, userRepo);
}

export function makeClearExpenses() {
  return new ClearExpenses(expenseRepo, personRepo);
}

export function makeUploadInvoice() {
  return new UploadInvoice(ruleRepo, categoryRuleRepo, expenseRepo, makeProcessInvoice());
}

export function makeGetExpenseMonths() {
  return new GetExpenseMonths(expenseRepo);
}

export function makeGetExpenseSuggestions() {
  return new GetExpenseSuggestions(expenseRepo);
}

export function makeLookupUserForInvite() {
  return new LookupUserForInvite(userRepo, personRepo);
}

export function makeGetSharedExpenses() {
  return new GetSharedExpenses(expenseRepo);
}

export function makeHandleSharedExpense() {
  return new HandleSharedExpense(expenseRepo, notificationRepo);
}

export function makeWipeSystem() {
  return new WipeSystem(expenseRepo, ruleRepo, personRepo, userRepo);
}

export function makeGetSessionProfile() {
  return new GetSessionProfile(userRepo);
}

export function makeChangePassword() {
  return new ChangePassword(userRepo, hasher);
}

export function makeResetUserPassword() {
  return new ResetUserPassword(userRepo, hasher);
}

export function makeHandleGoogleCallback() {
  return new HandleGoogleCallback(userRepo, personRepo, tokenService);
}

export function makeCreatePerson() {
  return new CreatePersonUseCase(personRepo, async (email) => {
    const user = await userRepo.findByEmail(email);
    return user ? { id: user.id } : null;
  });
}

export function makeHandleInvite() {
  return new HandleInviteUseCase(personRepo, userRepo, notificationRepo);
}

export function makeGetPendingInvites() {
  return new GetPendingInvites(personRepo);
}

export function makeLoginUser() {
  return new LoginUserUseCase(userRepo, hasher, tokenService);
}

export function makeRegisterUser() {
  return new RegisterUserUseCase(userRepo, hasher);
}

export function makeSearchExpenses() {
  return new SearchExpensesUseCase(expenseRepo);
}

export function makeSyncCategoryRules() {
  return new SyncCategoryRules(categoryRuleRepo, expenseRepo);
}

export function makeSyncSelfPerson() {
  return new SyncSelfPersonUseCase(personRepo);
}

export function makeUpdateProfile() {
  return new UpdateProfileUseCase(userRepo, makeSyncSelfPerson());
}

export function makeManageUsers() {
  return new ManageUsersUseCase(userRepo);
}

export function makeProcessInvoice() {
  return new ProcessInvoice();
}
