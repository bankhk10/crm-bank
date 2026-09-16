/*
  Warnings:

  - You are about to drop the column `chemical_group_id` on the `demo_plots` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "demo_plots" DROP CONSTRAINT "demo_plots_chemical_group_id_fkey";

-- DropIndex
DROP INDEX "demo_plots_chemical_group_id_idx";

-- AlterTable
ALTER TABLE "demo_plots" DROP COLUMN "chemical_group_id";
