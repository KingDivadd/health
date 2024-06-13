-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "CaseNote" (
    "caseNote_id" TEXT NOT NULL,
    "patient_history" TEXT NOT NULL DEFAULT '',
    "assessment" TEXT NOT NULL DEFAULT '',
    "treatment_plan" TEXT NOT NULL DEFAULT '',
    "prescriptions" TEXT NOT NULL DEFAULT '',
    "add_notes" TEXT NOT NULL DEFAULT '',
    "presenting_complaint" TEXT DEFAULT '',
    "presenting_complaint_history" TEXT DEFAULT '',
    "past_medical_history" TEXT DEFAULT '',
    "past_medication" TEXT DEFAULT '',
    "current_medication" TEXT DEFAULT '',
    "family_history" TEXT DEFAULT '',
    "social_history" TEXT DEFAULT '',
    "review_of_system" TEXT DEFAULT '',
    "examination_findings" TEXT DEFAULT '',
    "diagnostics" TEXT DEFAULT '',
    "plan" TEXT DEFAULT '',
    "appointment_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "physician_id" TEXT NOT NULL,
    "created_at" DECIMAL(65,30) NOT NULL,
    "updated_at" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "CaseNote_pkey" PRIMARY KEY ("caseNote_id")
);

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("appointment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_physician_id_fkey" FOREIGN KEY ("physician_id") REFERENCES "Physician"("physician_id") ON DELETE RESTRICT ON UPDATE CASCADE;
