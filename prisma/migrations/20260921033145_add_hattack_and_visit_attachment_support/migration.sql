-- AlterTable
ALTER TABLE "activity_attachments" ADD COLUMN     "demo_plot_visit_id" TEXT;

-- AlterTable
ALTER TABLE "demo_plot_visits" ADD COLUMN     "work_type_code" TEXT;

-- AlterTable
ALTER TABLE "demo_plots" ADD COLUMN     "plot_type" TEXT NOT NULL DEFAULT 'GENERAL_DEMO',
ALTER COLUMN "crop_category" DROP NOT NULL,
ALTER COLUMN "crop_name" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "activity_attachments_demo_plot_visit_id_idx" ON "activity_attachments"("demo_plot_visit_id");

-- CreateIndex
CREATE INDEX "demo_plot_visits_work_type_code_idx" ON "demo_plot_visits"("work_type_code");

-- CreateIndex
CREATE INDEX "demo_plots_plot_type_idx" ON "demo_plots"("plot_type");

-- AddForeignKey
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_demo_plot_visit_id_fkey" FOREIGN KEY ("demo_plot_visit_id") REFERENCES "demo_plot_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
