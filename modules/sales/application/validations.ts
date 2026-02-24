/**
 * Sales Validations
 * Shared Zod schemas for client form and server validation.
 */

import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().min(1, "กรุณาเลือกสินค้า"),
  quantity: z.number().min(0, "จำนวนต้องไม่ติดลบ"),
  unitPrice: z.number().min(0, "ราคาต้องไม่ติดลบ"),
  originalPrice: z.number(),
  priceModified: z.boolean().default(false),
});

export const saleFormSchema = z.object({
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  employeeId: z.string().min(1, "กรุณาเลือกพนักงานขาย"),
  paymentTerm: z.enum(["CREDIT_90", "CASH_7", "PREPAID", "CREDIT_OVER_90"]),
  creditDays: z.number().optional(),
  creditDueDate: z.string().optional(),
  usePromotionalCredit: z.boolean().optional(),
  promotionalCreditUsed: z.number().optional(),
  saleDate: z.string().min(1, "กรุณาระบุวันที่ขาย"),
  requestedDeliveryDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliveryMethod: z
    .enum(["SALES_DELIVERY", "FACTORY_DELIVERY", "CUSTOMER_PICKUP", "COURIER"])
    .optional(),
  pickupCompanyId: z.string().optional(),
  shippingCompanyId: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  useCustomShipping: z.boolean().optional(),
  selectedAddressId: z.string().optional(),
  customShippingAddress: z.string().optional(),
  items: z
    .array(saleItemSchema)
    .min(1, "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ"),
  shippingCost: z.number().default(0),
  otherCosts: z.number().default(0),
  otherCostsDescription: z.string().optional(),
  notes: z.string().optional(),
});

export type SaleFormValues = z.infer<typeof saleFormSchema>;
