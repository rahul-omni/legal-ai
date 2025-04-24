/*
  Warnings:

  - A unique constraint covering the columns `[role_id,name]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "permissions_role_id_name_key" ON "permissions"("role_id", "name");
