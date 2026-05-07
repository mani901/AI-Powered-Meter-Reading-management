-- Add approval workflow columns to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPendingApproval" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "User" ALTER COLUMN "isActive" SET DEFAULT false;

-- Change default meter status to PENDING
ALTER TABLE "Meter" ALTER COLUMN "status" SET DEFAULT 'PENDING';
