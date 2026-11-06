-- AlterTable
ALTER TABLE "activity_attachments" ADD COLUMN     "spray_round_id" TEXT;

-- CreateTable
CREATE TABLE "activity_result_spray_rounds" (
    "id" TEXT NOT NULL,
    "activity_result_id" TEXT NOT NULL,
    "demo_plot_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "spray_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spray_method" TEXT NOT NULL,
    "spray_equipment" TEXT NOT NULL,
    "other_equipment" TEXT,
    "product_response" TEXT NOT NULL,
    "problem_detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_result_spray_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_result_spray_products" (
    "id" TEXT NOT NULL,
    "spray_round_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "baseline_rate" TEXT,
    "actual_rate" TEXT NOT NULL,
    "quantity_used" DECIMAL(10,2) NOT NULL,
    "unit" TEXT,

    CONSTRAINT "activity_result_spray_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_result_spray_externals" (
    "id" TEXT NOT NULL,
    "spray_round_id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "active_ingredient" TEXT,
    "formula" TEXT NOT NULL,
    "custom_formula" TEXT,
    "application_rate" TEXT NOT NULL,

    CONSTRAINT "activity_result_spray_externals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_result_spray_rounds_activity_result_id_idx" ON "activity_result_spray_rounds"("activity_result_id");

-- CreateIndex
CREATE INDEX "activity_result_spray_rounds_demo_plot_id_idx" ON "activity_result_spray_rounds"("demo_plot_id");

-- CreateIndex
CREATE INDEX "activity_result_spray_rounds_round_number_idx" ON "activity_result_spray_rounds"("round_number");

-- CreateIndex
CREATE INDEX "activity_result_spray_products_spray_round_id_idx" ON "activity_result_spray_products"("spray_round_id");

-- CreateIndex
CREATE INDEX "activity_result_spray_products_product_id_idx" ON "activity_result_spray_products"("product_id");

-- CreateIndex
CREATE INDEX "activity_result_spray_externals_spray_round_id_idx" ON "activity_result_spray_externals"("spray_round_id");

-- CreateIndex
CREATE INDEX "activity_attachments_spray_round_id_idx" ON "activity_attachments"("spray_round_id");

-- AddForeignKey
ALTER TABLE "activity_result_spray_rounds" ADD CONSTRAINT "activity_result_spray_rounds_activity_result_id_fkey" FOREIGN KEY ("activity_result_id") REFERENCES "activity_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_spray_rounds" ADD CONSTRAINT "activity_result_spray_rounds_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_spray_products" ADD CONSTRAINT "activity_result_spray_products_spray_round_id_fkey" FOREIGN KEY ("spray_round_id") REFERENCES "activity_result_spray_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_spray_products" ADD CONSTRAINT "activity_result_spray_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_spray_externals" ADD CONSTRAINT "activity_result_spray_externals_spray_round_id_fkey" FOREIGN KEY ("spray_round_id") REFERENCES "activity_result_spray_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_spray_round_id_fkey" FOREIGN KEY ("spray_round_id") REFERENCES "activity_result_spray_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
