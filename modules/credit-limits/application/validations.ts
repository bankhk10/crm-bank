import { z } from "zod";

export const creditLimitSchema = z.object({
  customerId: z.string().min(1),
  limitAmount: z.number().nonnegative(),
  promoAmount: z.number().nonnegative().optional(),
  effectiveDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});

export const creditLimitUpdateSchema = z.object({
  limitAmount: z.number().nonnegative().optional(),
  promoAmount: z.number().nonnegative().optional(),
  usedAmount: z.number().optional(),
  effectiveDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "EXPIRED"]).optional(),
  notes: z.string().optional(),
});
