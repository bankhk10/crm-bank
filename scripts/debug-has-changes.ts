import 'dotenv/config';
import { db as prisma } from '../lib/db';

async function main() {
  const item = await prisma.saleItem.findUnique({
    where: { id: 'cmqg2su5k000a01qqv6olv93c' },
    include: {
      product: {
        include: {
          category: true,
          productABCType: true,
          productGroup: true,
          tradeNameGroup: true,
        }
      }
    }
  });

  if (item && item.product) {
    const product = item.product;
    const newBrand = product.brand;
    const newCommonName = product.commonName;
    const newName = product.name;
    const newProductABCTypeId = product.productABCTypeId;
    const newTradeNameGroupId = product.tradeNameGroupId;
    const newCategoryId = product.categoryId;
    const newCategoryName = product.category?.description ?? null;
    const newProductABCTypeName = product.productABCType?.name ?? null;
    const newProductGroupId = product.productGroupId;
    const newProductGroupName = product.productGroup?.name ?? null;

    console.log('Comparing fields:');
    console.log(`brand: "${item.brand}" !== "${newBrand}" -> ${item.brand !== newBrand}`);
    console.log(`commonName: "${item.commonName}" !== "${newCommonName}" -> ${item.commonName !== newCommonName}`);
    console.log(`name: "${item.name}" !== "${newName}" -> ${item.name !== newName}`);
    console.log(`productABCTypeId: "${item.productABCTypeId}" !== "${newProductABCTypeId}" -> ${item.productABCTypeId !== newProductABCTypeId}`);
    console.log(`tradeNameGroupId: "${item.tradeNameGroupId}" !== "${newTradeNameGroupId}" -> ${item.tradeNameGroupId !== newTradeNameGroupId}`);
    console.log(`categoryId: "${item.categoryId}" !== "${newCategoryId}" -> ${item.categoryId !== newCategoryId}`);
    console.log(`categoryName: "${item.categoryName}" !== "${newCategoryName}" -> ${item.categoryName !== newCategoryName}`);
    console.log(`productABCTypeName: "${item.productABCTypeName}" !== "${newProductABCTypeName}" -> ${item.productABCTypeName !== newProductABCTypeName}`);
    console.log(`productGroupId: "${item.productGroupId}" !== "${newProductGroupId}" -> ${item.productGroupId !== newProductGroupId}`);
    console.log(`productGroupName: "${item.productGroupName}" !== "${newProductGroupName}" -> ${item.productGroupName !== newProductGroupName}`);

    const hasChanges =
      item.brand !== newBrand ||
      item.commonName !== newCommonName ||
      item.name !== newName ||
      item.productABCTypeId !== newProductABCTypeId ||
      item.tradeNameGroupId !== newTradeNameGroupId ||
      item.categoryId !== newCategoryId ||
      item.categoryName !== newCategoryName ||
      item.productABCTypeName !== newProductABCTypeName ||
      item.productGroupId !== newProductGroupId ||
      item.productGroupName !== newProductGroupName;

    console.log(`hasChanges: ${hasChanges}`);
  }
}

main().finally(() => prisma.$disconnect());
