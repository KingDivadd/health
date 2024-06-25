-- CreateTable
CREATE TABLE "Notification" (
    "notification_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "title" TEXT DEFAULT '',
    "details" TEXT DEFAULT '',
    "appointment_id" TEXT,
    "transaction_id" TEXT,
    "caseNote_id" TEXT,
    "created_at" DECIMAL(65,30) NOT NULL,
    "updated_at" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notification_id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("appointment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("transaction_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_caseNote_id_fkey" FOREIGN KEY ("caseNote_id") REFERENCES "CaseNote"("caseNote_id") ON DELETE SET NULL ON UPDATE CASCADE;
