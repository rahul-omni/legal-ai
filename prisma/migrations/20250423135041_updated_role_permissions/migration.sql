/*
  Warnings:

  - You are about to drop the column `permission_id` on the `roles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_permission_id_fkey";

-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "role_id" UUID;

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "permission_id";

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
