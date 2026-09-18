-- AlterTable
ALTER TABLE "activity_result_demo_items" ADD COLUMN     "application_rate" TEXT;

-- AlterTable
ALTER TABLE "demo_plot_visits" ADD COLUMN     "other_equipment" TEXT,
ADD COLUMN     "spray_equipment" TEXT,
ADD COLUMN     "spray_method" TEXT;
