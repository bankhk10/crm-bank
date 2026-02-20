import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(2),
  companyCode: z.string().optional(),
  shortName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  addressLine: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subdistrict: z.string().optional(),
  postalCode: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const companyUpdateSchema = companySchema.partial();

export type CompanyFormValues = z.infer<typeof companySchema>;
export type CompanyUpdateFormValues = z.infer<typeof companyUpdateSchema>;
