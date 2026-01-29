import { PrismaClient } from "@prisma/client";

export async function seedClear(prisma: PrismaClient) {
  console.log("🧹 Clearing data...");

  // Delete in correct order to avoid foreign key constraints
  await prisma.saleStatusHistory.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.customerImage.deleteMany();
  await prisma.temporaryCreditLimit.deleteMany();
  await prisma.creditLimit.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.productStockLot.deleteMany();
  await prisma.productPromotionItem.deleteMany();
  await prisma.productFreeItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.userPermissionOverride.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.productGroupMaster.deleteMany();
  await prisma.chemicalGroup.deleteMany();
  await prisma.productCategory.deleteMany();

  console.log("✅ Data cleared.");
}
