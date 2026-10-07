-- AlterTable
ALTER TABLE "demo_plots" ADD COLUMN     "chemical_group_id" TEXT,
ALTER COLUMN "primary_product_name" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "demo_plots_customer_id_idx" ON "demo_plots"("customer_id");

-- CreateIndex
CREATE INDEX "demo_plots_chemical_group_id_idx" ON "demo_plots"("chemical_group_id");

-- CreateIndex
CREATE INDEX "demo_plots_province_idx" ON "demo_plots"("province");

-- CreateIndex
CREATE INDEX "demo_plots_district_idx" ON "demo_plots"("district");

-- AddForeignKey
ALTER TABLE "demo_plots" ADD CONSTRAINT "demo_plots_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_plots" ADD CONSTRAINT "demo_plots_chemical_group_id_fkey" FOREIGN KEY ("chemical_group_id") REFERENCES "ProductGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
