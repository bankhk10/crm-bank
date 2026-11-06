-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('DRAFT', 'PENDING_LINE_APPROVAL', 'PENDING_BUDGET_APPROVAL', 'PENDING_HELPER_APPROVAL', 'APPROVED', 'REJECTED', 'WAITING_FOR_CORRECTION', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActivityHelperStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActivityApprovalAction" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'REQUEST_CORRECTION', 'CANCEL');

-- CreateEnum
CREATE TYPE "ActivityApprovalStep" AS ENUM ('LINE_APPROVAL', 'BUDGET_APPROVAL', 'HELPER_APPROVAL');

-- CreateTable
CREATE TABLE "ActivityPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "activity_type" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sales_promotion_budget" DECIMAL(15,2),
    "marketing_budget" DECIMAL(15,2),
    "notes" TEXT,
    "status" "ActivityStatus" NOT NULL DEFAULT 'DRAFT',
    "employee_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "current_approver_id" TEXT,
    "sales_promotion_approved" BOOLEAN,
    "marketing_approved" BOOLEAN,
    "sales_manager_approved" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ActivityPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityHelper" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "status" "ActivityHelperStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ActivityHelper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityApprovalLog" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "ActivityApprovalAction" NOT NULL,
    "step" "ActivityApprovalStep" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityApprovalLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityPlan_employee_id_idx" ON "ActivityPlan"("employee_id");

-- CreateIndex
CREATE INDEX "ActivityPlan_current_approver_id_idx" ON "ActivityPlan"("current_approver_id");

-- CreateIndex
CREATE INDEX "ActivityPlan_status_idx" ON "ActivityPlan"("status");

-- CreateIndex
CREATE INDEX "ActivityHelper_employee_id_idx" ON "ActivityHelper"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityHelper_activity_plan_id_employee_id_key" ON "ActivityHelper"("activity_plan_id", "employee_id");

-- CreateIndex
CREATE INDEX "ActivityApprovalLog_activity_plan_id_idx" ON "ActivityApprovalLog"("activity_plan_id");

-- AddForeignKey
ALTER TABLE "ActivityPlan" ADD CONSTRAINT "ActivityPlan_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityPlan" ADD CONSTRAINT "ActivityPlan_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityPlan" ADD CONSTRAINT "ActivityPlan_current_approver_id_fkey" FOREIGN KEY ("current_approver_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityHelper" ADD CONSTRAINT "ActivityHelper_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "ActivityPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityHelper" ADD CONSTRAINT "ActivityHelper_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityHelper" ADD CONSTRAINT "ActivityHelper_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityApprovalLog" ADD CONSTRAINT "ActivityApprovalLog_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "ActivityPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityApprovalLog" ADD CONSTRAINT "ActivityApprovalLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
