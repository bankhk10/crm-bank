import { z } from "zod";

export const shippingCompanySchema = z.object({
  name: z.string().min(2, "ชื่อบริษัทขนส่งต้องมีอย่างน้อย 2 ตัวอักษร"),
  phone: z.string().optional(),
  address: z.string().optional(),
  addressLine: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subdistrict: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  customerIds: z.array(z.string()).optional(),
});

export const shippingCompanyUpdateSchema = shippingCompanySchema
  .partial()
  .extend({
    name: z
      .string()
      .min(2, "ชื่อบริษัทขนส่งต้องมีอย่างน้อย 2 ตัวอักษร")
      .optional(),
  });

export type ShippingCompanyFormValues = z.infer<typeof shippingCompanySchema>;
export type ShippingCompanyUpdateFormValues = z.infer<
  typeof shippingCompanyUpdateSchema
>;
