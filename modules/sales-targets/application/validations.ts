import { z } from "zod";

// ─────────────────────────────────────────────
// Zod Schemas (shared between client form & server)
// ─────────────────────────────────────────────

export const salesTargetItemSchema = z.object({
  productId: z.string().min(1, "กรุณาเลือกสินค้า"),
  quantity: z.number().min(1, "จำนวนต้องมากกว่า 0"),
  amount: z.number().min(0, "ยอดเงินต้องไม่ติดลบ"),
});

export const salesTargetSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  employeeId: z.string().min(1, "กรุณาเลือกพนักงาน"),
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  items: z.array(salesTargetItemSchema).min(1, "กรุณาเพิ่มอย่างน้อย 1 รายการ"),
});

export type SalesTargetFormValues = z.infer<typeof salesTargetSchema>;
