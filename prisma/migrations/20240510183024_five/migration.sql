/*
  Warnings:

  - A unique constraint covering the columns `[patient_id]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[physician_id]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Account_patient_id_key";

-- DropIndex
DROP INDEX "Account_physician_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_patient_id_key" ON "Appointment"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_physician_id_key" ON "Appointment"("physician_id");
