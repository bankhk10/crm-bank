-- CreateTable
CREATE TABLE "activity_plan_type_13" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "has_products" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_plan_type_13_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_plan_type_13_plots" (
    "id" TEXT NOT NULL,
    "type_13_id" TEXT NOT NULL,
    "plot_index" INTEGER NOT NULL DEFAULT 1,
    "plot_name" TEXT NOT NULL,
    "store_id" TEXT,
    "dealer_name" TEXT,
    "owner_name" TEXT,
    "province" TEXT,
    "district" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "demo_plot_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_plan_type_13_plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_plan_type_13_products" (
    "id" TEXT NOT NULL,
    "type_13_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_plan_type_13_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_plan_type_14" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "source_activity_plan_id" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'EXISTING_PLOT',
    "has_products" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_plan_type_14_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_plan_type_14_plots" (
    "id" TEXT NOT NULL,
    "type_14_id" TEXT NOT NULL,
    "demo_plot_id" TEXT,
    "plot_name" TEXT,
    "dealer_name" TEXT,
    "owner_name" TEXT,
    "crop_category" TEXT,
    "crop_name" TEXT,
    "province" TEXT,
    "district" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_plan_type_14_plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_plan_type_14_products" (
    "id" TEXT NOT NULL,
    "type_14_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_plan_type_14_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_plan_type_13_activity_plan_id_key" ON "activity_plan_type_13"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_plan_type_13_activity_plan_id_idx" ON "activity_plan_type_13"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_plan_type_13_plots_type_13_id_idx" ON "activity_plan_type_13_plots"("type_13_id");

-- CreateIndex
CREATE INDEX "activity_plan_type_13_plots_store_id_idx" ON "activity_plan_type_13_plots"("store_id");

-- CreateIndex
CREATE INDEX "activity_plan_type_13_plots_demo_plot_id_idx" ON "activity_plan_type_13_plots"("demo_plot_id");

-- CreateIndex
CREATE INDEX "activity_plan_type_13_products_type_13_id_idx" ON "activity_plan_type_13_products"("type_13_id");

-- CreateIndex
CREATE INDEX "activity_plan_type_13_products_product_id_idx" ON "activity_plan_type_13_products"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_plan_type_14_activity_plan_id_key" ON "activity_plan_type_14"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_plan_type_14_activity_plan_id_idx" ON "activity_plan_type_14"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_plan_type_14_source_activity_plan_id_idx" ON "activity_plan_type_14"("source_activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_plan_type_14_plots_type_14_id_idx" ON "activity_plan_type_14_plots"("type_14_id");

-- CreateIndex
CREATE INDEX "activity_plan_type_14_plots_demo_plot_id_idx" ON "activity_plan_type_14_plots"("demo_plot_id");

-- CreateIndex
CREATE INDEX "activity_plan_type_14_products_type_14_id_idx" ON "activity_plan_type_14_products"("type_14_id");

-- CreateIndex
CREATE INDEX "activity_plan_type_14_products_product_id_idx" ON "activity_plan_type_14_products"("product_id");

-- AddForeignKey
ALTER TABLE "activity_plan_type_13" ADD CONSTRAINT "activity_plan_type_13_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_type_13_plots" ADD CONSTRAINT "activity_plan_type_13_plots_type_13_id_fkey" FOREIGN KEY ("type_13_id") REFERENCES "activity_plan_type_13"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_type_13_plots" ADD CONSTRAINT "activity_plan_type_13_plots_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_type_13_plots" ADD CONSTRAINT "activity_plan_type_13_plots_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_type_13_products" ADD CONSTRAINT "activity_plan_type_13_products_type_13_id_fkey" FOREIGN KEY ("type_13_id") REFERENCES "activity_plan_type_13"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_type_13_products" ADD CONSTRAINT "activity_plan_type_13_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_type_14" ADD CONSTRAINT "activity_plan_type_14_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_type_14" ADD CONSTRAINT "activity_plan_type_14_source_activity_plan_id_fkey" FOREIGN KEY ("source_activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_type_14_plots" ADD CONSTRAINT "activity_plan_type_14_plots_type_14_id_fkey" FOREIGN KEY ("type_14_id") REFERENCES "activity_plan_type_14"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_type_14_plots" ADD CONSTRAINT "activity_plan_type_14_plots_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_type_14_products" ADD CONSTRAINT "activity_plan_type_14_products_type_14_id_fkey" FOREIGN KEY ("type_14_id") REFERENCES "activity_plan_type_14"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_type_14_products" ADD CONSTRAINT "activity_plan_type_14_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
