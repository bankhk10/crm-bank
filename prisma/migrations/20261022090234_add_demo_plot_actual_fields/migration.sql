-- AlterTable
ALTER TABLE "demo_plots" ADD COLUMN "owner_subdistrict" TEXT;
ALTER TABLE "demo_plots" ADD COLUMN "spray_equipment" TEXT;
ALTER TABLE "demo_plots" ADD COLUMN "other_equipment" TEXT;

-- AlterTable
ALTER TABLE "demo_plot_products" ADD COLUMN "extra_quantity" DECIMAL(10,2);
ALTER TABLE "demo_plot_products" ADD COLUMN "extra_unit" TEXT;
ALTER TABLE "demo_plot_products" ADD COLUMN "is_additional" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "demo_plot_products" ADD COLUMN "withdrawn_quantity" DECIMAL(10,2);

