-- CreateEnum
CREATE TYPE "ActivityResultAction" AS ENUM ('RECORD_ACTUAL', 'UPDATE_ACTUAL', 'CHANGE_ACTUAL_STATUS');

-- CreateTable
CREATE TABLE "activity_result_logs" (
    "id" TEXT NOT NULL,
    "activity_result_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "ActivityResultAction" NOT NULL,
    "previous_status" "ActivityResultStatus",
    "new_status" "ActivityResultStatus",
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_result_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_result_logs_activity_result_id_idx" ON "activity_result_logs"("activity_result_id");

-- CreateIndex
CREATE INDEX "activity_result_logs_user_id_idx" ON "activity_result_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_result_logs_action_idx" ON "activity_result_logs"("action");

-- CreateIndex
CREATE INDEX "activity_result_logs_created_at_idx" ON "activity_result_logs"("created_at");

-- AddForeignKey
ALTER TABLE "activity_result_logs" ADD CONSTRAINT "activity_result_logs_activity_result_id_fkey" FOREIGN KEY ("activity_result_id") REFERENCES "activity_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_logs" ADD CONSTRAINT "activity_result_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
