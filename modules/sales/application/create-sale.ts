/**
 * Create Sale Use Case
 *
 * Orchestrates validation, credit checks, stock checks, number generation,
 * persistence and notification for creating a new sale.
 */

import type { SaleFormData } from "@/modules/sales/types";
import { sendNotificationUseCase } from "@/modules/notifications/application";
import {
  findCustomerWithCredit,
  findProductsByIds,
  findLastSaleNumber,
  findEmployeeWithManager,
  createSale,
} from "../infrastructure/sale.repository";
import { buildExplodedSaleAddresses } from "./address-builder";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function generateSaleNumber(lastNumber?: string | null): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const prefix = `SO${year}${month}`;

  if (!lastNumber || !lastNumber.startsWith(prefix)) {
    return `${prefix}0001`;
  }

  const lastSeq = parseInt(lastNumber.slice(-4));
  const newSeq = String(lastSeq + 1).padStart(4, "0");
  return `${prefix}${newSeq}`;
}

function getPackMultiplier(packageSizePerBox?: string | null): number {
  const packSize = parseFloat(packageSizePerBox || "1");
  return isNaN(packSize) || packSize <= 0 ? 1 : packSize;
}

// ─────────────────────────────────────────────
// Use Case
// ─────────────────────────────────────────────

export async function createSaleUseCase(
  body: SaleFormData,
  createdById: string,
) {
  // 1. Basic validation
  if (!body.customerId || !body.employeeId || !body.items?.length) {
    return { success: false as const, error: "Missing required fields" };
  }

  // 2. Fetch customer with credit
  const customer = await findCustomerWithCredit(body.customerId);
  if (!customer) {
    return { success: false as const, error: "Customer not found" };
  }

  // 3. Fetch products
  const productIds = body.items.map((i) => i.productId);
  const products = await findProductsByIds(productIds);
  const productMap = new Map(products.map((p) => [p.id, p]));

  // 4. Calculate totals
  const subtotal = body.items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    const multiplier = getPackMultiplier(product?.packageSizePerBox);
    return sum + item.quantity * item.unitPrice * multiplier;
  }, 0);
  const total = subtotal - body.shippingCost - body.otherCosts;

  // 5. Credit limit check
  if (body.paymentTerm !== "PREPAID") {
    const creditLimit = customer.creditLimits[0];
    if (!creditLimit) {
      return {
        success: false as const,
        error: "Customer does not have an active credit limit",
      };
    }

    const availableCredit = Number(creditLimit.availableAmount);
    const promotionalCredit = body.usePromotionalCredit
      ? Number(creditLimit.promoAmount || 0) -
        Number(body.promotionalCreditUsed || 0)
      : 0;

    if (total > availableCredit + promotionalCredit) {
      return {
        success: false as const,
        error: "Sale amount exceeds available credit limit",
        creditInfo: {
          available: availableCredit,
          promotional: promotionalCredit,
          required: total,
        },
      };
    }
  }

  // 6. Stock warnings (non-blocking)
  const stockWarnings: Array<{
    productId: string;
    productName: string;
    requested: number;
    available: number;
  }> = [];

  for (const item of body.items) {
    const product = productMap.get(item.productId);
    if (product) {
      const totalStock = product.stockLots.reduce(
        (sum, lot) => sum + lot.quantity,
        0,
      );
      const multiplier = getPackMultiplier(product.packageSizePerBox);
      const requestedUnits = item.quantity * multiplier;

      if (totalStock < requestedUnits) {
        stockWarnings.push({
          productId: product.id,
          productName: product.name,
          requested: item.quantity,
          available: totalStock,
        });
      }
    }
  }

  // 7. Generate sale number
  const lastNumber = await findLastSaleNumber();
  const saleNumber = generateSaleNumber(lastNumber);

  // 8. Build exploded addresses
  const explodedAddresses = await buildExplodedSaleAddresses(body, customer);

  // 8. Create sale
  const sale = await createSale({
    saleNumber,
    customerId: body.customerId,
    employeeId: body.employeeId,
    paymentTerm: body.paymentTerm,
    creditDays: body.creditDays,
    creditDueDate: body.creditDueDate ? new Date(body.creditDueDate) : null,
    usePromotionalCredit: body.usePromotionalCredit,
    promotionalCreditUsed: body.promotionalCreditUsed,
    saleDate: new Date(body.saleDate),
    requestedDeliveryDate: body.requestedDeliveryDate
      ? new Date(body.requestedDeliveryDate)
      : null,
    deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
    deliveryMethod: body.deliveryMethod,
    pickupCompanyId: body.pickupCompanyId,
    shippingCompanyId: body.shippingCompanyId,
    billingAddress: body.billingAddress,
    shippingAddress: body.shippingAddress,
    useCustomShipping: body.useCustomShipping,
    selectedAddressId: body.selectedAddressId,

    // Pass SaleAddress relation fields
    companyAddressId: body.companyAddressId,
    billingCustomerAddressId: body.billingCustomerAddressId,
    shippingCustomerAddressId:
      body.shippingCustomerAddressId || body.selectedAddressId,
    pickupCompanyAddressId: body.pickupCompanyAddressId || body.pickupCompanyId,
    shippingCompanyAddressId:
      body.shippingCompanyAddressId || body.shippingCompanyId,

    // Snapshots: Exploded Address Fields
    ...explodedAddresses,

    subtotalAmount: subtotal,
    shippingCost: body.shippingCost,
    otherCosts: body.otherCosts,
    otherCostsDescription: body.otherCostsDescription,
    totalAmount: total,
    notes: body.notes,
    createdById,
    items: body.items.map((item) => {
      const product = productMap.get(item.productId);
      const multiplier = getPackMultiplier(product?.packageSizePerBox);
      return {
        productId: item.productId,
        // Product Snapshot
        productCode: product?.productCode,
        name: product?.name,
        commonName: product?.commonName,
        unit: product?.unit,
        productGroup: product?.productGroup,
        brand: product?.brand,
        packageSize: product?.packageSize,
        packageSizePerBox: product?.packageSizePerBox,
        totalPackageSizePerBox: product?.totalPackageSizePerBox,
        price: product?.price ? Number(product.price) : null,
        cartonPrice: product?.cartonPrice ? Number(product.cartonPrice) : null,
        promotionBudget: product?.promotionBudget
          ? Number(product.promotionBudget)
          : null,
        pointPerUnit: product?.pointPerUnit,
        productChain: product?.productChain?.name,

        quantity: item.quantity,
        unitPrice: item.unitPrice,
        originalPrice: item.originalPrice,
        priceModified: item.priceModified,
        totalPrice: item.quantity * item.unitPrice * multiplier,
      };
    }),
  });

  // 9. Send notification to manager (non-blocking)
  try {
    const employee = await findEmployeeWithManager(body.employeeId);
    if (employee?.manager?.userId) {
      await sendNotificationUseCase({
        userId: employee.manager.userId,
        title: "รออนุมัติ",
        message: `รายการ ${saleNumber} จาก ${employee.name} ต้องการอนุมัติ`,
        type: "INFO",
        link: `/sales/${sale.id}`,
      });
    }
  } catch (notifError) {
    console.error("Failed to send notification to manager:", notifError);
  }

  return { success: true as const, sale, stockWarnings };
}
