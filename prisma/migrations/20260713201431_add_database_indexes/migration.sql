-- CreateIndex
CREATE INDEX "Person_userId_idx" ON "Person"("userId");

-- CreateIndex
CREATE INDEX "Expense_userId_month_idx" ON "Expense"("userId", "month");

-- CreateIndex
CREATE INDEX "Expense_userId_personId_idx" ON "Expense"("userId", "personId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "IntegrationLog_userId_createdAt_idx" ON "IntegrationLog"("userId", "createdAt");
