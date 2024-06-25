-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_physician_id_fkey";

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "patient_id" SET DEFAULT '',
ALTER COLUMN "physician_id" SET DEFAULT '';
