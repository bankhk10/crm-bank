/*
  Warnings:

  - You are about to drop the column `signatureDate` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `signatureImage` on the `Sale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "signatureDate",
DROP COLUMN "signatureImage",
ADD COLUMN     "approvedBySignatureDate" TIMESTAMP(3),
ADD COLUMN     "approvedBySignatureImage" TEXT,
ADD COLUMN     "checkedBySignatureDate" TIMESTAMP(3),
ADD COLUMN     "checkedBySignatureImage" TEXT,
ADD COLUMN     "preparedBySignatureDate" TIMESTAMP(3),
ADD COLUMN     "preparedBySignatureImage" TEXT;
