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
    "time" INTEGER NOT NULL,
    "complain" TEXT NOT NULL,
    "created_at" DECIMAL(65,30) NOT NULL,
    "updated_at" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("appointment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_patient_id_key" ON "Patient"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_email_key" ON "Patient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Physician_physician_id_key" ON "Physician"("physician_id");

-- CreateIndex
CREATE UNIQUE INDEX "Physician_email_key" ON "Physician"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_patient_id_key" ON "Account"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "Account_physician_id_key" ON "Account"("physician_id");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_patient_id_key" ON "Appointment"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_physician_id_key" ON "Appointment"("physician_id");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_physician_id_fkey" FOREIGN KEY ("physician_id") REFERENCES "Physician"("physician_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_physician_id_fkey" FOREIGN KEY ("physician_id") REFERENCES "Physician"("physician_id") ON DELETE SET NULL ON UPDATE CASCADE;
