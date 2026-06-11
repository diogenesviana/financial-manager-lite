-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "inviteEmail" TEXT,
ADD COLUMN     "linkStatus" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "linkedUserId" TEXT,
ADD COLUMN     "phone" TEXT;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
