-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "patient_id" DROP DEFAULT,
ALTER COLUMN "physician_id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_physician_id_fkey" FOREIGN KEY ("physician_id") REFERENCES "Physician"("physician_id") ON DELETE SET NULL ON UPDATE CASCADE;
