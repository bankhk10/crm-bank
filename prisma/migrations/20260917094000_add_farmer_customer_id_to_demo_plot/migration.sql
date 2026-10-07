-- AlterTable
ALTER TABLE "demo_plots" ADD COLUMN     "farmer_customer_id" TEXT;

-- CreateIndex
CREATE INDEX "demo_plots_farmer_customer_id_idx" ON "demo_plots"("farmer_customer_id");

-- AddForeignKey
ALTER TABLE "demo_plots" ADD CONSTRAINT "demo_plots_farmer_customer_id_fkey" FOREIGN KEY ("farmer_customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
