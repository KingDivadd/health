-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "patient_id" TEXT,
ADD COLUMN     "physician_id" TEXT;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_physician_id_fkey" FOREIGN KEY ("physician_id") REFERENCES "Physician"("physician_id") ON DELETE SET NULL ON UPDATE CASCADE;
