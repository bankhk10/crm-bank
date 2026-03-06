import { z } from "zod";

// ─────────────────────────────────────────────
// Zod Schemas (shared between client form & server)
// ─────────────────────────────────────────────

export const salesTargetItemSchema = z.object({
  productId: z.string().min(1, "กรุณาเลือกสินค้า"),
  pricePerBox: z.number().min(0, "ราคาต้องไม่ติดลบ"),
  qtyPerBox: z.number().min(1, "จำนวนต้องมากกว่า 0"),
  targetAmount: z.number().min(0, "เป้าหมายต้องไม่ติดลบ"),
});

export const salesTargetStoreSchema = z.object({
  customerId: z.string().min(1, "กรุณาเลือกร้านค้า"),
  items: z
    .array(salesTargetItemSchema)
    .min(1, "กรุณาเพิ่มอย่างน้อย 1 รายการสินค้า"),
});

export const salesTargetSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  employeeId: z.string().min(1, "กรุณาเลือกพนักงาน"),
  stores: z
    .array(salesTargetStoreSchema)
    .min(1, "กรุณาเพิ่มอย่างน้อย 1 ร้านค้า"),
});

export type SalesTargetFormValues = z.infer<typeof salesTargetSchema>;
export type SalesTargetStoreValues = z.infer<typeof salesTargetStoreSchema>;
export type SalesTargetItemValues = z.infer<typeof salesTargetItemSchema>;
