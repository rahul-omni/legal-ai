/*
  Warnings:

  - A unique constraint covering the columns `[created_by]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_created_by_fkey";

-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "created_by" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_created_by_key" ON "organizations"("created_by");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE CASCADE;
