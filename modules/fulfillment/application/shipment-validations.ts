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
  notes: z.string().nullable().optional(),
});

// ──────────────────────────────────────────
// Update Shipment
// ──────────────────────────────────────────

export const updateShipmentSchema = z.object({
  status: z.enum(["PENDING", "IN_TRANSIT", "DELIVERED", "CANCELLED"]).optional(),
  scheduledDate: z.string().nullable().optional(),
  actualDate: z.string().nullable().optional(),
  paymentDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  salesOrderNumber: z.string().nullable().optional(),
  shippingCompanyId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(createShipmentItemSchema).optional(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
