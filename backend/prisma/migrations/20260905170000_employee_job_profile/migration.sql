-- CreateEnum
CREATE TYPE "JobProfile" AS ENUM ('EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN');

-- Add new employee-owned identity fields.
ALTER TABLE "employees"
  ADD COLUMN "jobProfile" "JobProfile" NOT NULL DEFAULT 'EMPLOYEE',
  ADD COLUMN "password" TEXT;

-- Preserve credentials and role classification for linked accounts.
UPDATE "employees" AS employee
SET
  "password" = "user"."password",
  "jobProfile" = "user"."role"::text::"JobProfile"
FROM "users" AS "user"
WHERE "user"."employeeId" = employee."id";

-- Employee departments and job titles are no longer stored on employees.
ALTER TABLE "employees"
  DROP COLUMN "departmentId",
  DROP COLUMN "jobTitle";
