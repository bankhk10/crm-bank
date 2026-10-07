-- DropForeignKey
ALTER TABLE "activity_plan_stores" DROP CONSTRAINT "activity_plan_stores_store_id_fkey";

-- AlterTable
ALTER TABLE "activity_plan_stores" ADD COLUMN     "is_unregistered_farmer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "unregistered_farmer_name" TEXT,
ADD COLUMN     "unregistered_farmer_phone" TEXT,
ALTER COLUMN "store_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "activity_results" ADD COLUMN     "farmer_home_address" TEXT,
ADD COLUMN     "plot_latitude" DECIMAL(10,7),
ADD COLUMN     "plot_longitude" DECIMAL(10,7);

-- AddForeignKey
ALTER TABLE "activity_plan_stores" ADD CONSTRAINT "activity_plan_stores_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
