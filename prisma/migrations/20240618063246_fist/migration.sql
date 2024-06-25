-- CreateTable
CREATE TABLE "Patient" (
    "patient_id" TEXT NOT NULL,
    "last_name" TEXT NOT NULL DEFAULT '',
    "first_name" TEXT NOT NULL,
    "other_names" TEXT DEFAULT '',
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT DEFAULT '',
    "date_of_birth" DECIMAL(65,30) DEFAULT 0,
    "blood_group" TEXT DEFAULT '',
    "genotype" TEXT DEFAULT '',
    "avatar" TEXT DEFAULT '',
    "country_code" TEXT DEFAULT '',
    "phone_number" TEXT DEFAULT '',
    "organization_name" TEXT DEFAULT '',
    "organization_type" TEXT DEFAULT '',
    "position_held" TEXT DEFAULT '',
    "organization_size" INTEGER DEFAULT 0,
    "company_website_link" TEXT DEFAULT '',
    "address" TEXT DEFAULT '',
    "state" TEXT DEFAULT '',
    "country" TEXT DEFAULT '',
    "cac_document" TEXT DEFAULT '',
    "registration_document" TEXT DEFAULT '',
    "referral_code" TEXT DEFAULT '',
    "created_at" DECIMAL(65,30) NOT NULL,
    "updated_at" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("patient_id")
);

-- CreateTable
CREATE TABLE "Physician" (
    "physician_id" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "other_names" TEXT DEFAULT '',
    "email" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT NOT NULL,
    "gender" TEXT DEFAULT '',
    "date_of_birth" DECIMAL(65,30) DEFAULT 0,
    "registered_as" TEXT DEFAULT '',
    "speciality" TEXT DEFAULT '',
    "country_code" TEXT DEFAULT '',
    "phone_number" TEXT DEFAULT '',
    "address" TEXT DEFAULT '',
    "state" TEXT DEFAULT '',
    "country" TEXT DEFAULT '',
    "avatar" TEXT DEFAULT '',
    "medical_license" TEXT DEFAULT '',
    "cac_document" TEXT DEFAULT '',
    "professional_credentials" TEXT DEFAULT '',
    "verification_of_employment" TEXT DEFAULT '',
    "languages_spoken" TEXT[] DEFAULT ARRAY['']::TEXT[],
    "bio" TEXT DEFAULT '',
    "date_of_establishment" TEXT DEFAULT '',
    "created_at" DECIMAL(65,30) NOT NULL,
    "updated_at" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Physician_pkey" PRIMARY KEY ("physician_id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "transaction_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "account_id" TEXT,
    "patient_id" TEXT DEFAULT '',
    "physician_id" TEXT DEFAULT '',
    "transaction_type" TEXT NOT NULL DEFAULT '',
    "created_at" DECIMAL(65,30) NOT NULL,
    "updated_at" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "Account" (
    "account_id" TEXT NOT NULL,
    "available_balance" INTEGER NOT NULL DEFAULT 0,
    "patient_id" TEXT DEFAULT '',
    "physician_id" TEXT DEFAULT '',
    "created_at" DECIMAL(65,30) NOT NULL,
    "updated_at" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "appointment_id" TEXT NOT NULL,
    "patient_id" TEXT DEFAULT '',
    "physician_id" TEXT DEFAULT '',
    "mode_of_consult" TEXT NOT NULL,
    "appointment_type" TEXT DEFAULT '',
    "time" DECIMAL(65,30) NOT NULL,
    "complain" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DECIMAL(65,30) NOT NULL,
    "updated_at" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("appointment_id")
);

-- CreateTable
CREATE TABLE "Case_note" (
    "case_note_id" TEXT NOT NULL,
    "presenting_complaint" TEXT DEFAULT '',
    "history_of_presenting_complains" TEXT DEFAULT '',
    "past_medical_history" TEXT DEFAULT '',
    "past_medication" TEXT DEFAULT '',
    "current_medication" TEXT DEFAULT '',
    "family_history" TEXT DEFAULT '',
    "social_history" TEXT DEFAULT '',
    "review_of_system" TEXT DEFAULT '',
    "examination_findings" TEXT DEFAULT '',
    "assessment_or_diagnosis" TEXT DEFAULT '',
    "plan" TEXT DEFAULT '',
    "prescription" TEXT DEFAULT '',
    "test" TEXT DEFAULT '',
    "patient_id" TEXT NOT NULL,
    "physician_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "created_at" DECIMAL(65,30) NOT NULL,
    "updated_at" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Case_note_pkey" PRIMARY KEY ("case_note_id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notification_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "title" TEXT DEFAULT '',
    "details" TEXT DEFAULT '',
    "patient_id" TEXT,
    "physician_id" TEXT,
    "appointment_id" TEXT,
    "transaction_id" TEXT,
    "case_note_id" TEXT,
    "created_at" DECIMAL(65,30) NOT NULL,
    "updated_at" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "subscription_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "physician_id" TEXT,
    "subscription" TEXT NOT NULL,
    "created_at" DECIMAL(65,30) NOT NULL,
    "updated_at" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_patient_id_key" ON "Patient"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_email_key" ON "Patient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Physician_physician_id_key" ON "Physician"("physician_id");

-- CreateIndex
CREATE UNIQUE INDEX "Physician_email_key" ON "Physician"("email");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_physician_id_fkey" FOREIGN KEY ("physician_id") REFERENCES "Physician"("physician_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case_note" ADD CONSTRAINT "Case_note_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case_note" ADD CONSTRAINT "Case_note_physician_id_fkey" FOREIGN KEY ("physician_id") REFERENCES "Physician"("physician_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case_note" ADD CONSTRAINT "Case_note_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("appointment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_physician_id_fkey" FOREIGN KEY ("physician_id") REFERENCES "Physician"("physician_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("appointment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("transaction_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_case_note_id_fkey" FOREIGN KEY ("case_note_id") REFERENCES "Case_note"("case_note_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_physician_id_fkey" FOREIGN KEY ("physician_id") REFERENCES "Physician"("physician_id") ON DELETE SET NULL ON UPDATE CASCADE;
