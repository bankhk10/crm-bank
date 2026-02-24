import { z } from "zod";

export const createTemporaryCreditLimitSchema = z.object({
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  requestedAmount: z.union([
    z.number().positive("จำนวนเงินต้องมากกว่า 0"),
    z.string().transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) {
        throw new Error("จำนวนเงินไม่ถูกต้อง");
      }
      return num;
    }),
  ]),
  expiryDate: z.string().or(z.date()),
  notes: z.string().optional(),
});

export const updateTemporaryCreditLimitSchema = z.object({
  requestedAmount: z.number().positive("จำนวนเงินต้องมากกว่า 0").optional(),
  expiryDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});

export const approveTemporaryCreditLimitSchema = z.object({
  approve: z.boolean(),
  rejectionReason: z.string().optional(),
});

export type CreateTemporaryCreditLimitInput = z.infer<
  typeof createTemporaryCreditLimitSchema
>;
export type UpdateTemporaryCreditLimitInput = z.infer<
  typeof updateTemporaryCreditLimitSchema
>;
export type ApproveTemporaryCreditLimitInput = z.infer<
  typeof approveTemporaryCreditLimitSchema
>;
