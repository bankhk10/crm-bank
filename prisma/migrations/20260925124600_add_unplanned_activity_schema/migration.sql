-- CreateEnum
CREATE TYPE "ActivityPlanType" AS ENUM ('PLANNED', 'UNPLANNED');

-- AlterEnum
ALTER TYPE "ActivityApprovalStep" ADD VALUE 'POST_ACTIVITY_REVIEW';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityStatus" ADD VALUE 'PENDING_REVIEW';
ALTER TYPE "ActivityStatus" ADD VALUE 'REVIEWED';
ALTER TYPE "ActivityStatus" ADD VALUE 'RETURNED';

-- AlterTable
ALTER TABLE "activity_plans" ADD COLUMN     "plan_type" "ActivityPlanType" NOT NULL DEFAULT 'PLANNED';
