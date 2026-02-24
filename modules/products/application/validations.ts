import { z } from "zod";

export const productSchema = z.object({
  productCode: z.string().min(1, "รหัสสินค้าต้องไม่ว่าง"),
  name: z.string().min(1, "ชื่อสินค้าต้องไม่ว่าง"),
  commonName: z.string().optional(),
  unit: z.string().optional(),
  productGroup: z.string().optional(),
  brand: z.string().optional(),
  chemicalGroup: z.string().optional(),
  packageSize: z.string().optional(),
  packageSizePerBox: z.string().optional(),
  totalPackageSizePerBox: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  usedForPlants: z.array(z.string()).default([]),
  salesPoint: z.string().optional(),
  properties: z.string().optional(),
  pointPerUnit: z.number().int().min(0).optional(),
  categoryId: z.string().optional(),
  productChainId: z.string().optional(),
});

export const productUpdateSchema = productSchema.partial();

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductUpdateFormValues = z.infer<typeof productUpdateSchema>;
