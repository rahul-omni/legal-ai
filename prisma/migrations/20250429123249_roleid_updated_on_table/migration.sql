/*
  Warnings:

  - You are about to drop the column `role` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `org_memberships` table. All the data in the column will be lost.
  - Added the required column `role_id` to the `invitations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_id` to the `org_memberships` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_role_fkey";

-- AlterTable
ALTER TABLE "invitations" DROP COLUMN "role",
ADD COLUMN     "role_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "org_memberships" DROP COLUMN "role",
ADD COLUMN     "role_id" UUID NOT NULL;

-- DropEnum
DROP TYPE "RoleEnum";

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
