-- AlterTable
ALTER TABLE "Administration" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "avatar" TEXT;

-- AlterTable
ALTER TABLE "Parent" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "avatar" TEXT;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;
