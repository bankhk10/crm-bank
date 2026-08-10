-- AlterTable
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "firstAwaitingDeliveryAt" TIMESTAMP(3);
