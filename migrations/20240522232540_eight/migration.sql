/*
  Warnings:

  - You are about to drop the column `add_notes` on the `CaseNote` table. All the data in the column will be lost.
  - You are about to drop the column `assessment` on the `CaseNote` table. All the data in the column will be lost.
  - You are about to drop the column `diagnostics` on the `CaseNote` table. All the data in the column will be lost.
  - You are about to drop the column `patient_history` on the `CaseNote` table. All the data in the column will be lost.
  - You are about to drop the column `prescriptions` on the `CaseNote` table. All the data in the column will be lost.
  - You are about to drop the column `presenting_complaint_history` on the `CaseNote` table. All the data in the column will be lost.
  - You are about to drop the column `treatment_plan` on the `CaseNote` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CaseNote" DROP COLUMN "add_notes",
DROP COLUMN "assessment",
DROP COLUMN "diagnostics",
DROP COLUMN "patient_history",
DROP COLUMN "prescriptions",
DROP COLUMN "presenting_complaint_history",
DROP COLUMN "treatment_plan",
ADD COLUMN     "assessment_or_diagnosis" TEXT DEFAULT '',
ADD COLUMN     "history_of_presenting_complains" TEXT DEFAULT '';
