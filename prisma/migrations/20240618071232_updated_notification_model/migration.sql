/*
  Warnings:

  - You are about to drop the column `details` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `notification_type` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "meeting_id" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "details",
DROP COLUMN "title",
ADD COLUMN     "notification_type" TEXT NOT NULL;
