/*
  Warnings:

  - Added the required column `schoolid` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolid` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolid` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolid` to the `Test` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "schoolid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "schoolid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "schoolid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "schoolid" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_schoolid_fkey" FOREIGN KEY ("schoolid") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_schoolid_fkey" FOREIGN KEY ("schoolid") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_schoolid_fkey" FOREIGN KEY ("schoolid") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_schoolid_fkey" FOREIGN KEY ("schoolid") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
