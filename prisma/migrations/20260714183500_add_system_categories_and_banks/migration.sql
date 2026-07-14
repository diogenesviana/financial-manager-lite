-- CreateTable
CREATE TABLE "SystemCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemBank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemBank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemCategory_name_key" ON "SystemCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SystemBank_name_key" ON "SystemBank"("name");
