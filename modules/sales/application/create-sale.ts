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
import { db } from "@/lib/db";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function generateSaleNumber(date: Date, lastNumber?: string | null): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `${year}${month}`;

  if (!lastNumber || !lastNumber.startsWith(prefix)) {
    return `${prefix}0001`;
  }

  const lastSeq = parseInt(lastNumber.slice(-4));
  const newSeq = String(lastSeq + 1).padStart(4, "0");
  return `${prefix}${newSeq}`;
}

function getPackMultiplier(packageSizePerBox?: string | number | null): number {
  const packSize = parseFloat(packageSizePerBox?.toString() || "1");
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
  if (!body.customerId || !body.employeeId || !body.items?.length || !body.requestedDeliveryDate) {
    return { success: false as const, error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" };
  }

  // 2. Fetch customer with credit
  const customer = await findCustomerWithCredit(body.customerId);
  if (!customer) {
    return { success: false as const, error: "ไม่พบข้อมูลลูกค้า" };
  }

  // 3. Fetch products
  const productIds = body.items.map((i) => i.productId);
  const products = await findProductsByIds(productIds);
  const productMap = new Map(products.map((p) => [p.id, p]));

  // 4. Calculate totals
  const subtotal = body.items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    const multiplier = getPackMultiplier(product?.packageSizePerBox as any);
    return sum + item.quantity * item.unitPrice * multiplier;
  }, 0);
  const total = subtotal - body.shippingCost - body.otherCosts;

  // 5. Credit limit check
  if (body.paymentTerm !== "PREPAID") {
    const creditLimit = customer.creditLimits[0];
      if (!creditLimit) {
        return {
          success: false as const,
          error: "ลูกค้าไม่มีวงเงินเครดิตที่ใช้งานอยู่",
        };
      }

    const availableCredit = Number(creditLimit.availableAmount);
    const promotionalCredit = body.usePromotionalCredit
      ? Number(creditLimit.promoAmount || 0) -
      Number(body.promotionalCreditUsed || 0)
      : 0;

    // Include active temporary credit
    let activeTempCredit = 0;
    const tempAmount = Number(creditLimit.temporaryCreditAmount || 0);
    if (tempAmount > 0) {
      const tempExpiryDate = creditLimit.temporaryCreditExpiryDate;
      if (!tempExpiryDate) {
        activeTempCredit = tempAmount;
      } else {
        const tempExpiry = new Date(tempExpiryDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Include the current day

        if (tempExpiry >= now) {
          activeTempCredit = tempAmount;
        }
      }
    }

    if (total > availableCredit + activeTempCredit + promotionalCredit) {
      return {
        success: false as const,
        error: "ยอดขายเกินวงเงินเครดิตที่ใช้งานได้",
        creditInfo: {
          available: availableCredit + activeTempCredit,
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
      const multiplier = getPackMultiplier(product.packageSizePerBox as any);
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
  const saleDateForNumber = new Date(body.saleDate);
  const saleNumberPrefix = `${saleDateForNumber.getFullYear()}${String(saleDateForNumber.getMonth() + 1).padStart(2, "0")}`;
  const lastNumber = await findLastSaleNumber(saleNumberPrefix);
  const saleNumber = generateSaleNumber(saleDateForNumber, lastNumber);

  // 8. Build exploded addresses
  const explodedAddresses = await buildExplodedSaleAddresses(body, customer);

  // 9. Fetch employee signature for preparedBy
  const employeeForSig = await db.employee.findUnique({
    where: { id: body.employeeId },
    select: { signature: true },
  });

  // 10. Create sale
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
    preparedBySignatureDate: new Date(),
    preparedBySignatureImage: employeeForSig?.signature || null,
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
        productGroup: product?.productGroup?.name,
        productABCTypeId: product?.productABCTypeId,
        tradeNameGroupId: product?.tradeNameGroupId,
        brand: product?.brand,
        packageSize: product?.packageSize as any,
        packageSizeUnit: product?.packageSizeUnit,
        packageSizePerBox: product?.packageSizePerBox as any,
        totalPackageSizePerBox: product?.totalPackageSizePerBox as any,
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
        productChain: product?.productABCType?.name,

        quantity: item.quantity,
        unitPrice: item.unitPrice,
        originalPrice: item.originalPrice,
        priceModified: item.priceModified,
        totalPrice: item.quantity * item.unitPrice * multiplier,
      };
    }),
  });

  // 11. Send notification to manager (non-blocking)
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
