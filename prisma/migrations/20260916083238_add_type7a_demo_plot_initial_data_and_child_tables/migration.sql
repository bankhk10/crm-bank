-- AlterTable
ALTER TABLE "activity_attachments" ADD COLUMN     "demo_plot_id" TEXT;

-- AlterTable
ALTER TABLE "demo_plots" ADD COLUMN     "has_external_chemicals" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "initial_spray_date" TIMESTAMP(3),
ADD COLUMN     "is_unregistered_farmer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "longitude" DECIMAL(10,7),
ADD COLUMN     "main_crop_info" TEXT,
ADD COLUMN     "next_spray_date" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "owner_phone" TEXT,
ADD COLUMN     "spray_method" TEXT;

-- CreateTable
CREATE TABLE "demo_plot_products" (
    "id" TEXT NOT NULL,
    "demo_plot_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "application_rate" TEXT NOT NULL,
    "quantity" DECIMAL(10,2),
    "unit" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "demo_plot_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_plot_external_products" (
    "id" TEXT NOT NULL,
    "demo_plot_id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "active_ingredient" TEXT,
    "formula" TEXT NOT NULL,
    "custom_formula" TEXT,
    "application_rate" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_plot_external_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_plot_irrigations" (
    "id" TEXT NOT NULL,
    "demo_plot_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,

    CONSTRAINT "demo_plot_irrigations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demo_plot_products_demo_plot_id_idx" ON "demo_plot_products"("demo_plot_id");

-- CreateIndex
CREATE INDEX "demo_plot_products_product_id_idx" ON "demo_plot_products"("product_id");

-- CreateIndex
CREATE INDEX "demo_plot_external_products_demo_plot_id_idx" ON "demo_plot_external_products"("demo_plot_id");

-- CreateIndex
CREATE INDEX "demo_plot_irrigations_demo_plot_id_idx" ON "demo_plot_irrigations"("demo_plot_id");

-- CreateIndex
CREATE UNIQUE INDEX "demo_plot_irrigations_demo_plot_id_method_key" ON "demo_plot_irrigations"("demo_plot_id", "method");

-- CreateIndex
CREATE INDEX "activity_attachments_demo_plot_id_idx" ON "activity_attachments"("demo_plot_id");

-- AddForeignKey
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_plot_products" ADD CONSTRAINT "demo_plot_products_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_plot_products" ADD CONSTRAINT "demo_plot_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_plot_external_products" ADD CONSTRAINT "demo_plot_external_products_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_plot_irrigations" ADD CONSTRAINT "demo_plot_irrigations_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
