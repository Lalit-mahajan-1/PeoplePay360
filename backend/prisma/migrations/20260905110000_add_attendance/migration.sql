-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM (
  'PRESENT',
  'LATE',
  'ABSENT',
  'HALF_DAY',
  'ON_LEAVE',
  'HOLIDAY',
  'WEEKEND'
);

-- CreateTable
CREATE TABLE "attendance" (
  "id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "work_date" DATE NOT NULL,
  "check_in" TIMESTAMP(3),
  "check_out" TIMESTAMP(3),
  "worked_minutes" INTEGER NOT NULL DEFAULT 0,
  "overtime_minutes" INTEGER NOT NULL DEFAULT 0,
  "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
  "is_manual_edit" BOOLEAN NOT NULL DEFAULT false,
  "corrected_by" TEXT,
  "corrected_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "attendance_employee_id_work_date_key"
  ON "attendance"("employee_id", "work_date");

CREATE INDEX "attendance_work_date_idx" ON "attendance"("work_date");
CREATE INDEX "attendance_corrected_by_idx" ON "attendance"("corrected_by");

-- AddForeignKeys
ALTER TABLE "attendance"
  ADD CONSTRAINT "attendance_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attendance"
  ADD CONSTRAINT "attendance_corrected_by_fkey"
  FOREIGN KEY ("corrected_by") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
