-- DropForeignKey
ALTER TABLE "Administration" DROP CONSTRAINT "Administration_schoolid_fkey";

-- AlterTable
ALTER TABLE "Administration" ALTER COLUMN "schoolid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Administration" ADD CONSTRAINT "Administration_schoolid_fkey" FOREIGN KEY ("schoolid") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
