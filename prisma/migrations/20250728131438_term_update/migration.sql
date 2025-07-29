/*
  Warnings:

  - You are about to drop the column `schoolid` on the `Term` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_teacherid_fkey";

-- DropForeignKey
ALTER TABLE "Term" DROP CONSTRAINT "Term_schoolid_fkey";

-- AlterTable
ALTER TABLE "Subject" ALTER COLUMN "teacherid" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Term" DROP COLUMN "schoolid";

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_teacherid_fkey" FOREIGN KEY ("teacherid") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
