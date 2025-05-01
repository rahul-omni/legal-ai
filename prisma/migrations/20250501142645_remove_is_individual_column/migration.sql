/*
  Warnings:

  - You are about to drop the column `is_individual` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "InvitationStatus" ADD VALUE 'ACTIVE';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_individual";
