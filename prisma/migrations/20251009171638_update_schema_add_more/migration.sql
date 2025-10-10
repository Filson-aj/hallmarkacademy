/*
  Warnings:

  - You are about to drop the column `schoolid` on the `Administration` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Administration` table. All the data in the column will be lost.
  - You are about to drop the column `studentid` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `testid` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `duedate` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `schoolid` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `subjectid` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `teacherid` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `schoolid` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `studentid` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `formmasterid` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `schoolid` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `classid` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `classid` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `schoolid` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `subjectid` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `teacherid` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `schoolid` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `studentid` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `schoolid` on the `PaymentSetup` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `PaymentSetup` table. All the data in the column will be lost.
  - You are about to drop the column `testid` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `admissiondate` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `admissionnumber` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `avarta` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `classid` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `parentid` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `schoolid` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `exams` on the `StudentGrade` table. All the data in the column will be lost.
  - You are about to drop the column `firstCa` on the `StudentGrade` table. All the data in the column will be lost.
  - You are about to drop the column `fourthCa` on the `StudentGrade` table. All the data in the column will be lost.
  - You are about to drop the column `secondCa` on the `StudentGrade` table. All the data in the column will be lost.
  - You are about to drop the column `studentid` on the `StudentGrade` table. All the data in the column will be lost.
  - You are about to drop the column `subjectgradeid` on the `StudentGrade` table. All the data in the column will be lost.
  - You are about to drop the column `thirdCa` on the `StudentGrade` table. All the data in the column will be lost.
  - You are about to drop the column `schoolid` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `teacherid` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `assignmentid` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `studentid` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `avarta` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `schoolid` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `daysopen` on the `Term` table. All the data in the column will be lost.
  - You are about to drop the column `nextterm` on the `Term` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Term` table. All the data in the column will be lost.
  - You are about to drop the column `schoolid` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `subjectid` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `teacherid` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `testdate` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `testtime` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the `ClassGrade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EffectiveDomain` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Grade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PsychomotiveDomain` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubjectGrade` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[schoolId,email]` on the table `Administration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,username]` on the table `Administration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,name]` on the table `Class` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,session,term]` on the table `PaymentSetup` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,admissionNumber]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,username]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,email]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,phone]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,gradingId,subjectId,classId]` on the table `StudentGrade` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,name]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,email]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,phone]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,username]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Administration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Announcement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `testId` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dueDate` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacherId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classId` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectId` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacherId` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `News` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Parent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `PaymentSetup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PaymentSetup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `testId` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `School` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classId` to the `StudentGrade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gradingId` to the `StudentGrade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `StudentGrade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectId` to the `StudentGrade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `StudentGrade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `daysOpen` to the `Term` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nextTerm` to the `Term` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Term` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Term` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classId` to the `Test` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Test` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectId` to the `Test` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacherId` to the `Test` table without a default value. This is not possible if the table is not empty.
  - Added the required column `testDate` to the `Test` table without a default value. This is not possible if the table is not empty.
  - Added the required column `testTime` to the `Test` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Test` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_DUE', 'PAYMENT_CONFIRMED', 'NEW_USER', 'NEW_EVENT', 'NEW_ANNOUNCEMENT', 'ASSIGNMENT_DUE', 'TEST_SCHEDULED', 'GENERAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "TraitCategory" AS ENUM ('AFFECTIVE', 'PSYCHOMOTOR', 'BEHAVIOURAL', 'COGNITIVE');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('PROMOTED', 'REPEATED', 'GRADUATED', 'WITHDRAWN');

-- DropForeignKey
ALTER TABLE "Administration" DROP CONSTRAINT "Administration_schoolid_fkey";

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_studentid_fkey";

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_testid_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_schoolid_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_subjectid_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_teacherid_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_schoolid_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_studentid_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_formmasterid_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_schoolid_fkey";

-- DropForeignKey
ALTER TABLE "ClassGrade" DROP CONSTRAINT "ClassGrade_classid_fkey";

-- DropForeignKey
ALTER TABLE "ClassGrade" DROP CONSTRAINT "ClassGrade_gradeid_fkey";

-- DropForeignKey
ALTER TABLE "EffectiveDomain" DROP CONSTRAINT "EffectiveDomain_gradeid_fkey";

-- DropForeignKey
ALTER TABLE "EffectiveDomain" DROP CONSTRAINT "EffectiveDomain_studentid_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_classid_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_schoolid_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_classid_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_schoolid_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_subjectid_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_teacherid_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_schoolid_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_studentid_fkey";

-- DropForeignKey
ALTER TABLE "PaymentSetup" DROP CONSTRAINT "PaymentSetup_schoolid_fkey";

-- DropForeignKey
ALTER TABLE "PsychomotiveDomain" DROP CONSTRAINT "PsychomotiveDomain_gradeid_fkey";

-- DropForeignKey
ALTER TABLE "PsychomotiveDomain" DROP CONSTRAINT "PsychomotiveDomain_studentid_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_testid_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_classid_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_parentid_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_schoolid_fkey";

-- DropForeignKey
ALTER TABLE "StudentGrade" DROP CONSTRAINT "StudentGrade_studentid_fkey";

-- DropForeignKey
ALTER TABLE "StudentGrade" DROP CONSTRAINT "StudentGrade_subjectgradeid_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_schoolid_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_teacherid_fkey";

-- DropForeignKey
ALTER TABLE "SubjectGrade" DROP CONSTRAINT "SubjectGrade_classid_fkey";

-- DropForeignKey
ALTER TABLE "SubjectGrade" DROP CONSTRAINT "SubjectGrade_subjectid_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_assignmentid_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_studentid_fkey";

-- DropForeignKey
ALTER TABLE "Teacher" DROP CONSTRAINT "Teacher_schoolid_fkey";

-- DropForeignKey
ALTER TABLE "Test" DROP CONSTRAINT "Test_schoolid_fkey";

-- DropForeignKey
ALTER TABLE "Test" DROP CONSTRAINT "Test_subjectid_fkey";

-- DropForeignKey
ALTER TABLE "Test" DROP CONSTRAINT "Test_teacherid_fkey";

-- DropIndex
DROP INDEX "Administration_email_key";

-- DropIndex
DROP INDEX "Administration_username_key";

-- DropIndex
DROP INDEX "Class_name_key";

-- DropIndex
DROP INDEX "Parent_phone_key";

-- DropIndex
DROP INDEX "Parent_username_key";

-- DropIndex
DROP INDEX "School_phone_key";

-- DropIndex
DROP INDEX "Student_admissionnumber_key";

-- DropIndex
DROP INDEX "Student_email_key";

-- DropIndex
DROP INDEX "Student_phone_key";

-- DropIndex
DROP INDEX "Student_username_key";

-- DropIndex
DROP INDEX "Teacher_email_key";

-- DropIndex
DROP INDEX "Teacher_phone_key";

-- DropIndex
DROP INDEX "Teacher_username_key";

-- AlterTable
ALTER TABLE "Administration" DROP COLUMN "schoolid",
DROP COLUMN "updateAt",
ADD COLUMN     "schoolId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "schoolId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "studentid",
DROP COLUMN "testid",
DROP COLUMN "updateAt",
ADD COLUMN     "studentId" TEXT NOT NULL,
ADD COLUMN     "testId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "duedate",
DROP COLUMN "schoolid",
DROP COLUMN "subjectid",
DROP COLUMN "teacherid",
DROP COLUMN "updateAt",
ADD COLUMN     "classId" TEXT NOT NULL,
ADD COLUMN     "dueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "subjectId" TEXT NOT NULL,
ADD COLUMN     "teacherId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "graded" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "schoolid",
DROP COLUMN "studentid",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "formmasterid",
DROP COLUMN "schoolid",
DROP COLUMN "updateAt",
ADD COLUMN     "formmasterId" TEXT,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "classid",
ADD COLUMN     "classId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "schoolId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Gallery" ADD COLUMN     "schoolId" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "classid",
DROP COLUMN "schoolid",
DROP COLUMN "subjectid",
DROP COLUMN "teacherid",
ADD COLUMN     "classId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "subjectId" TEXT NOT NULL,
ADD COLUMN     "teacherId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "News" DROP COLUMN "updateAt",
ADD COLUMN     "schoolId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Parent" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "schoolid",
DROP COLUMN "studentid",
DROP COLUMN "updateAt",
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "studentId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PaymentSetup" DROP COLUMN "schoolid",
DROP COLUMN "updateAt",
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "testid",
ADD COLUMN     "testId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "School" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "admissiondate",
DROP COLUMN "admissionnumber",
DROP COLUMN "avarta",
DROP COLUMN "classid",
DROP COLUMN "parentid",
DROP COLUMN "schoolid",
DROP COLUMN "updateAt",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "admissionNumber" TEXT,
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "classId" TEXT NOT NULL,
ADD COLUMN     "parentId" TEXT NOT NULL,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentGrade" DROP COLUMN "exams",
DROP COLUMN "firstCa",
DROP COLUMN "fourthCa",
DROP COLUMN "secondCa",
DROP COLUMN "studentid",
DROP COLUMN "subjectgradeid",
DROP COLUMN "thirdCa",
ADD COLUMN     "classId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gradingId" TEXT NOT NULL,
ADD COLUMN     "studentId" TEXT NOT NULL,
ADD COLUMN     "subjectId" TEXT NOT NULL,
ADD COLUMN     "subjectPosition" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "grade" DROP NOT NULL,
ALTER COLUMN "grade" SET DATA TYPE TEXT,
ALTER COLUMN "remark" DROP NOT NULL,
ALTER COLUMN "remark" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "schoolid",
DROP COLUMN "teacherid",
DROP COLUMN "updateAt",
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "teacherId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "assignmentid",
DROP COLUMN "studentid",
DROP COLUMN "updateAt",
ADD COLUMN     "assignmentId" TEXT,
ADD COLUMN     "studentId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "avarta",
DROP COLUMN "schoolid",
DROP COLUMN "updateAt",
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Term" DROP COLUMN "daysopen",
DROP COLUMN "nextterm",
DROP COLUMN "updateAt",
ADD COLUMN     "daysOpen" INTEGER NOT NULL,
ADD COLUMN     "nextTerm" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Test" DROP COLUMN "schoolid",
DROP COLUMN "subjectid",
DROP COLUMN "teacherid",
DROP COLUMN "testdate",
DROP COLUMN "testtime",
DROP COLUMN "updateAt",
ADD COLUMN     "classId" TEXT NOT NULL,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "subjectId" TEXT NOT NULL,
ADD COLUMN     "teacherId" TEXT NOT NULL,
ADD COLUMN     "testDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "testTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "ClassGrade";

-- DropTable
DROP TABLE "EffectiveDomain";

-- DropTable
DROP TABLE "Grade";

-- DropTable
DROP TABLE "PsychomotiveDomain";

-- DropTable
DROP TABLE "SubjectGrade";

-- CreateTable
CREATE TABLE "GradingPolicy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "passMark" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "gradingPolicyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grading" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "term" "Terms" NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "gradingPolicyId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAssessment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "gradingId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trait" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TraitCategory" NOT NULL,
    "gradingPolicyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentTrait" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "remark" TEXT,
    "traitId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "gradingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentTrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCard" (
    "id" TEXT NOT NULL,
    "totalScore" DOUBLE PRECISION,
    "averageScore" DOUBLE PRECISION,
    "classPosition" TEXT,
    "remark" TEXT,
    "formmasterRemark" TEXT,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "gradingId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPromotion" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromClassId" TEXT NOT NULL,
    "toClassId" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "promotedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PromotionStatus" NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "broadcast" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT,
    "teacherId" TEXT,
    "parentId" TEXT,
    "adminId" TEXT,
    "schoolId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AssessmentToStudentGrade" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AssessmentToStudentGrade_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "GradingPolicy_createdAt_idx" ON "GradingPolicy"("createdAt");

-- CreateIndex
CREATE INDEX "Assessment_gradingPolicyId_idx" ON "Assessment"("gradingPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_gradingPolicyId_name_key" ON "Assessment"("gradingPolicyId", "name");

-- CreateIndex
CREATE INDEX "Grading_session_term_gradingPolicyId_idx" ON "Grading"("session", "term", "gradingPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "Grading_gradingPolicyId_session_term_key" ON "Grading"("gradingPolicyId", "session", "term");

-- CreateIndex
CREATE INDEX "StudentAssessment_studentId_assessmentId_subjectId_classId__idx" ON "StudentAssessment"("studentId", "assessmentId", "subjectId", "classId", "gradingId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAssessment_studentId_assessmentId_subjectId_classId__key" ON "StudentAssessment"("studentId", "assessmentId", "subjectId", "classId", "gradingId");

-- CreateIndex
CREATE INDEX "ReportCard_studentId_gradingId_classId_idx" ON "ReportCard"("studentId", "gradingId", "classId");

-- CreateIndex
CREATE INDEX "Notification_schoolId_idx" ON "Notification"("schoolId");

-- CreateIndex
CREATE INDEX "_AssessmentToStudentGrade_B_index" ON "_AssessmentToStudentGrade"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Administration_schoolId_email_key" ON "Administration"("schoolId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Administration_schoolId_username_key" ON "Administration"("schoolId", "username");

-- CreateIndex
CREATE INDEX "Assignment_schoolId_idx" ON "Assignment"("schoolId");

-- CreateIndex
CREATE INDEX "Attendance_schoolId_idx" ON "Attendance"("schoolId");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "Class_schoolId_idx" ON "Class"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_schoolId_name_key" ON "Class"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Gallery_schoolId_idx" ON "Gallery"("schoolId");

-- CreateIndex
CREATE INDEX "Lesson_schoolId_idx" ON "Lesson"("schoolId");

-- CreateIndex
CREATE INDEX "News_schoolId_idx" ON "News"("schoolId");

-- CreateIndex
CREATE INDEX "Payment_studentId_idx" ON "Payment"("studentId");

-- CreateIndex
CREATE INDEX "Payment_schoolId_idx" ON "Payment"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSetup_schoolId_session_term_key" ON "PaymentSetup"("schoolId", "session", "term");

-- CreateIndex
CREATE INDEX "Student_schoolId_idx" ON "Student"("schoolId");

-- CreateIndex
CREATE INDEX "Student_classId_idx" ON "Student"("classId");

-- CreateIndex
CREATE INDEX "Student_parentId_idx" ON "Student"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_schoolId_admissionNumber_key" ON "Student"("schoolId", "admissionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Student_schoolId_username_key" ON "Student"("schoolId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "Student_schoolId_email_key" ON "Student"("schoolId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_schoolId_phone_key" ON "Student"("schoolId", "phone");

-- CreateIndex
CREATE INDEX "StudentGrade_studentId_gradingId_subjectId_classId_idx" ON "StudentGrade"("studentId", "gradingId", "subjectId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGrade_studentId_gradingId_subjectId_classId_key" ON "StudentGrade"("studentId", "gradingId", "subjectId", "classId");

-- CreateIndex
CREATE INDEX "Subject_schoolId_idx" ON "Subject"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_schoolId_name_key" ON "Subject"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Teacher_schoolId_idx" ON "Teacher"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_schoolId_email_key" ON "Teacher"("schoolId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_schoolId_phone_key" ON "Teacher"("schoolId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_schoolId_username_key" ON "Teacher"("schoolId", "username");

-- CreateIndex
CREATE INDEX "Test_schoolId_idx" ON "Test"("schoolId");

-- AddForeignKey
ALTER TABLE "Administration" ADD CONSTRAINT "Administration_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_formmasterId_fkey" FOREIGN KEY ("formmasterId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSetup" ADD CONSTRAINT "PaymentSetup_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingPolicy" ADD CONSTRAINT "GradingPolicy_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_gradingPolicyId_fkey" FOREIGN KEY ("gradingPolicyId") REFERENCES "GradingPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grading" ADD CONSTRAINT "Grading_gradingPolicyId_fkey" FOREIGN KEY ("gradingPolicyId") REFERENCES "GradingPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grading" ADD CONSTRAINT "Grading_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_gradingId_fkey" FOREIGN KEY ("gradingId") REFERENCES "Grading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_gradingId_fkey" FOREIGN KEY ("gradingId") REFERENCES "Grading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trait" ADD CONSTRAINT "Trait_gradingPolicyId_fkey" FOREIGN KEY ("gradingPolicyId") REFERENCES "GradingPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTrait" ADD CONSTRAINT "StudentTrait_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "Trait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTrait" ADD CONSTRAINT "StudentTrait_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTrait" ADD CONSTRAINT "StudentTrait_gradingId_fkey" FOREIGN KEY ("gradingId") REFERENCES "Grading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_gradingId_fkey" FOREIGN KEY ("gradingId") REFERENCES "Grading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPromotion" ADD CONSTRAINT "StudentPromotion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPromotion" ADD CONSTRAINT "StudentPromotion_fromClassId_fkey" FOREIGN KEY ("fromClassId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPromotion" ADD CONSTRAINT "StudentPromotion_toClassId_fkey" FOREIGN KEY ("toClassId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Administration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssessmentToStudentGrade" ADD CONSTRAINT "_AssessmentToStudentGrade_A_fkey" FOREIGN KEY ("A") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssessmentToStudentGrade" ADD CONSTRAINT "_AssessmentToStudentGrade_B_fkey" FOREIGN KEY ("B") REFERENCES "StudentGrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
