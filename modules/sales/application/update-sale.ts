/**
 * Update Sale Use Case
 *
 * Orchestrates validation, permission checks, credit/stock reversal,
 * recalculation, and persistence for updating an existing sale.
 */

import type { SaleFormData } from "@/modules/sales/types";
import {
  findProductsByIds,
  updateSale,
} from "../infrastructure/sale.repository";
import { db } from "@/lib/db";
import { buildExplodedSaleAddresses } from "./address-builder";
import { releaseStockUseCase as releaseStock } from "@/modules/products/application";
import { revertPointsForSaleUseCase as revertPointsForSale } from "@/modules/points";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getPackMultiplier(packageSizePerBox?: string | number | null): number {
  const packSize = parseFloat(packageSizePerBox?.toString() || "1");
  return isNaN(packSize) || packSize <= 0 ? 1 : packSize;
}

// ─────────────────────────────────────────────
// Use Case
// ─────────────────────────────────────────────

export async function updateSaleUseCase(
  id: string,
  body: SaleFormData,
  userId: string,
) {
  // 1. Check if sale exists
  const existingSale = await db.sale.findUnique({
    where: { id, deletedAt: null },
    include: { customer: true },
  });

  if (!existingSale) {
    return { success: false as const, error: "ไม่พบข้อมูลออเดอร์" };
  }

  // 1.1 Basic validation
  if (!body.customerId || !body.employeeId || !body.items?.length || !body.requestedDeliveryDate) {
    return { success: false as const, error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" };
  }

  // 2. Permission check for rejected/waiting sales
  // if (
  //   existingSale.status === "REJECTED" ||
  //   existingSale.status === "WAITING_FOR_CORRECTION"
  // ) {
  //   const isCreator = userId === existingSale.createdById;
  //   if (!isCreator) {
  //     return {
  //       success: false as const,
  //       error:
  //         "Only the creator or admin can edit rejected or waiting for correction sales",
  //     };
  //   }
  // }

  // 3. Check delivery date updates
  let newDeliveryUpdateCount = existingSale.deliveryUpdateCount;
  if (
    body.deliveryDate &&
    (!existingSale.deliveryDate ||
      new Date(body.deliveryDate).getTime() !==
      existingSale.deliveryDate.getTime())
  ) {
    newDeliveryUpdateCount++;
  }

  // 4. fetch products for calculation
  const productIds = body.items.map((item) => item.productId);
  const products = await findProductsByIds(productIds);
  const productMap = new Map(products.map((p) => [p.id, p]));

  // 5. Determine if re-approval needed
  const needsReapproval =
    existingSale.status === "APPROVED" ||
    existingSale.status === "AWAITING_DELIVERY" ||
    existingSale.status === "REJECTED" ||
    existingSale.status === "WAITING_FOR_CORRECTION";

  // 6. Calculate totals
  const subtotal = body.items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    const multiplier = getPackMultiplier(product?.packageSizePerBox as any);
    return sum + item.quantity * item.unitPrice * multiplier;
  }, 0);
  const total = subtotal - body.shippingCost - body.otherCosts;

  // 7. Build exploded addresses
  const targetCustomer =
    body.customerId === existingSale.customerId
      ? existingSale.customer
      : await db.customer.findUnique({ where: { id: body.customerId } });
  const explodedAddresses = await buildExplodedSaleAddresses(
    body,
    targetCustomer,
  );

  // 8. Persist and orchestrate credit/stock in a transaction
  const sale = await db.$transaction(async (tx) => {
    // 8.1 Return credit limit if sale was approved and used credit
    if (needsReapproval && existingSale.paymentTerm !== "PREPAID") {
      const creditLimit = await tx.creditLimit.findFirst({
        where: {
          customerId: existingSale.customerId,
          status: "ACTIVE",
          deletedAt: null,
        },
      });

      if (creditLimit) {
        await tx.creditLimit.update({
          where: { id: creditLimit.id },
          data: {
            usedAmount: { decrement: existingSale.totalAmount },
            availableAmount: { increment: existingSale.totalAmount },
          },
        });
      }
    }

    // 8.2 If reverting to PENDING, release stock and revert points
    if (needsReapproval) {
      await releaseStock(id, tx);
      await revertPointsForSale(id, tx);
    }

    // 8.3 Update sale record
    return updateSale(
      id,
      {
        existingSale,
        customerId: body.customerId,
        region: targetCustomer?.region || null,
        employeeId: body.employeeId,
        paymentTerm: body.paymentTerm,
        creditDays: body.creditDays,
        creditDueDate: body.creditDueDate ? new Date(body.creditDueDate) : null,
        usePromotionalCredit: body.usePromotionalCredit,
        promotionalCreditUsed: body.promotionalCreditUsed,
        deliveryMethod: body.deliveryMethod,
        pickupCompanyId: body.pickupCompanyId,
        shippingCompanyId: body.shippingCompanyId,
        saleDate: new Date(body.saleDate),
        requestedDeliveryDate: body.requestedDeliveryDate
          ? new Date(body.requestedDeliveryDate)
          : null,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        deliveryUpdateCount: newDeliveryUpdateCount,
        billingAddress: body.billingAddress,
        useCustomShipping: body.useCustomShipping,
        selectedAddressId: body.selectedAddressId,

        // Pass SaleAddress relation fields
        companyAddressId: body.companyAddressId,
        billingCustomerAddressId: body.billingCustomerAddressId,
        shippingCustomerAddressId:
          body.shippingCustomerAddressId || body.selectedAddressId,
        pickupCompanyAddressId: body.pickupCompanyAddressId || body.pickupCompanyId || null,
        shippingCompanyAddressId:
          body.shippingCompanyAddressId || body.shippingCompanyId || null,

        // Snapshots: Exploded Address Fields
        ...explodedAddresses,

        subtotalAmount: subtotal,
        shippingCost: body.shippingCost,
        otherCosts: body.otherCosts,
        otherCostsDescription: body.otherCostsDescription,
        totalAmount: total,
        notes: body.notes,
        userId,
        needsReapproval,
        items: body.items.map((item) => {
          const product = productMap.get(item.productId);
          const multiplier = getPackMultiplier(product?.packageSizePerBox as any);
          return {
            productId: item.productId,
            // Product Snapshot
            productCode: product?.productCode,
            name: product?.name,
            commonName: product?.commonName,
            unit: product?.unit,
            productGroupId: product?.productGroupId,
            productGroupName: product?.productGroup?.name,
            productABCTypeId: product?.productABCTypeId,
            tradeNameGroupId: product?.tradeNameGroupId,
            tradeNameGroupName: product?.tradeNameGroup?.description,
            categoryId: product?.categoryId,
            categoryName: product?.category?.description,
            brand: product?.brand,
            packageSize: product?.packageSize as any,
            packageSizeUnit: product?.packageSizeUnit,
            packageSizePerBox: product?.packageSizePerBox as any,
            totalPackageSizePerBox: product?.totalPackageSizePerBox as any,
            status: product?.status,
            usedForPlants: product?.usedForPlants || [],
            salesPoint: product?.salesPoint,
            properties: product?.properties,
            parentId: product?.parentId,
            price: product?.price != null ? Number(product.price) : null,
            cartonPrice: (() => {
              const packSize = parseFloat(product?.packageSizePerBox?.toString() || "0");
              if (!isNaN(packSize) && packSize > 0) {
                return item.unitPrice * packSize;
              }
              return product?.cartonPrice != null
                ? Number(product.cartonPrice)
                : null;
            })(),
            promotionBudget:
              item.promotionBudget != null ? Number(item.promotionBudget) : 0,
            pointPerUnit: product?.pointPerUnit,
            productABCTypeName: product?.productABCType?.name,

            quantity: item.quantity,
            unitPrice: item.unitPrice,
            originalPrice: item.originalPrice,
            priceModified: item.priceModified,
            totalPrice: item.quantity * item.unitPrice * multiplier,
          };
        }),
      },
      tx,
    );
  });

  return { success: true as const, sale, existingSale };
}
