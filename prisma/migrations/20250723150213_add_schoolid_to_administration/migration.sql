/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `News` table. All the data in the column will be lost.
  - Added the required column `schoolid` to the `Administration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolid` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolid` to the `Term` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Administration" ADD COLUMN     "schoolid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "schoolid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Gallery" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "News" DROP COLUMN "updatedAt",
ADD COLUMN     "updateAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Term" ADD COLUMN     "schoolid" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Administration" ADD CONSTRAINT "Administration_schoolid_fkey" FOREIGN KEY ("schoolid") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolid_fkey" FOREIGN KEY ("schoolid") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_schoolid_fkey" FOREIGN KEY ("schoolid") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
