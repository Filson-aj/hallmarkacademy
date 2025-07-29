/*
  Warnings:

  - You are about to drop the column `lessonId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `assignmentId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `Submission` table. All the data in the column will be lost.
  - Added the required column `schoolid` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentid` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentid` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_classId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_studentId_fkey";

-- AlterTable
ALTER TABLE "Administration" ALTER COLUMN "username" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Assignment" ALTER COLUMN "file" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "lessonId",
DROP COLUMN "studentId",
ADD COLUMN     "schoolid" TEXT NOT NULL,
ADD COLUMN     "studentid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "classId",
ADD COLUMN     "classid" TEXT;

-- AlterTable
ALTER TABLE "Parent" ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "occupation" DROP NOT NULL,
ALTER COLUMN "religion" DROP NOT NULL,
ALTER COLUMN "state" DROP NOT NULL,
ALTER COLUMN "lga" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "admissionnumber" DROP NOT NULL,
ALTER COLUMN "studenttype" DROP NOT NULL,
ALTER COLUMN "house" DROP NOT NULL,
ALTER COLUMN "bloodgroup" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "state" DROP NOT NULL,
ALTER COLUMN "lga" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Subject" ALTER COLUMN "category" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "assignmentId",
DROP COLUMN "studentId",
ADD COLUMN     "assignmentid" TEXT,
ADD COLUMN     "studentid" TEXT NOT NULL,
ALTER COLUMN "feedback" DROP NOT NULL,
ALTER COLUMN "score" DROP NOT NULL,
ALTER COLUMN "file" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "state" DROP NOT NULL,
ALTER COLUMN "lga" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignmentid_fkey" FOREIGN KEY ("assignmentid") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentid_fkey" FOREIGN KEY ("studentid") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentid_fkey" FOREIGN KEY ("studentid") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_schoolid_fkey" FOREIGN KEY ("schoolid") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_classid_fkey" FOREIGN KEY ("classid") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
