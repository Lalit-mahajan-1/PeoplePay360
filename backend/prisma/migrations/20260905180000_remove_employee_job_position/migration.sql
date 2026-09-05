-- Job classification is now represented exclusively by Employee.jobProfile.
ALTER TABLE "employees" DROP COLUMN "jobPosition";
