-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_physician_id_fkey";

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "patient_id" DROP NOT NULL,
ALTER COLUMN "physician_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_physician_id_fkey" FOREIGN KEY ("physician_id") REFERENCES "Physician"("physician_id") ON DELETE SET NULL ON UPDATE CASCADE;
