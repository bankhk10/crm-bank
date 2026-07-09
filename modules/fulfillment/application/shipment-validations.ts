import { z } from "zod";

// ──────────────────────────────────────────
// Create Shipment
// ──────────────────────────────────────────

export const createShipmentItemSchema = z.object({
  saleItemId: z.string().min(1, "กรุณาระบุรายการสินค้า"),
  quantity: z.number().int().positive("จำนวนต้องมากกว่า 0"),
});

export const createShipmentSchema = z.object({
  items: z
    .array(createShipmentItemSchema)
    .min(1, "กรุณาระบุรายการสินค้าอย่างน้อย 1 รายการ"),
  scheduledDate: z.string().nullable().optional(),
  paymentDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  salesOrderNumber: z.string().nullable().optional(),
  shippingCompanyId: z.string().nullable().optional(),
  shippingCompanyName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  shippingDiscount: z.number().nullable().optional(),
  billDiscount: z.number().nullable().optional(),
  useCustomDeliveryMethod: z.boolean().optional(),
  deliveryMethod: z.string().nullable().optional(),
  pickupCompanyId: z.string().nullable().optional(),
  pickupCompanyName: z.string().nullable().optional(),
  shippingAddress: z.string().nullable().optional(),
  customerShippingAddress: z.string().nullable().optional(),
});

// ──────────────────────────────────────────
// Update Shipment
// ──────────────────────────────────────────

export const updateShipmentSchema = z.object({
  status: z.enum(["PENDING", "IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED"]).optional(),
  scheduledDate: z.string().nullable().optional(),
  actualDate: z.string().nullable().optional(),
  paymentDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  salesOrderNumber: z.string().nullable().optional(),
  shippingCompanyId: z.string().nullable().optional(),
  shippingCompanyName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  shippingDiscount: z.number().nullable().optional(),
  billDiscount: z.number().nullable().optional(),
  items: z.array(createShipmentItemSchema).optional(),
  useCustomDeliveryMethod: z.boolean().optional(),
  deliveryMethod: z.string().nullable().optional(),
  pickupCompanyId: z.string().nullable().optional(),
  pickupCompanyName: z.string().nullable().optional(),
  shippingAddress: z.string().nullable().optional(),
  customerShippingAddress: z.string().nullable().optional(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
