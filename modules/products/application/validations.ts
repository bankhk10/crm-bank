import { z } from "zod";

export const productSchema = z.object({
  productCode: z.string().min(1, "รหัสสินค้าต้องไม่ว่าง"),
  name: z.string().min(1, "ชื่อสินค้าต้องไม่ว่าง"),
  commonName: z.string().optional(),
  unit: z.string().optional(),
  tradeNameGroupId: z.string().nullable().optional(),
  brand: z.string().optional(),
  productGroupId: z.string().nullable().optional(),
  packageSize: z.coerce.number().optional(),
  packageSizeUnit: z.string().optional(),
  packageSizePerBox: z.coerce.number().optional(),
  totalPackageSizePerBox: z.coerce.number().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  usedForPlants: z.array(z.string()).default([]),
  salesPoint: z.string().optional(),
  properties: z.string().optional(),
  pointPerUnit: z.number().int().min(0).optional(),
  categoryId: z.string().nullable().optional(),
  productABCTypeId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
});

export const productUpdateSchema = productSchema.partial();

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductUpdateFormValues = z.infer<typeof productUpdateSchema>;

export const productManagementSchema = z.object({
  price: z.number().optional(),
  cartonPrice: z.number().optional(),
  packageSizePerBox: z.coerce.number().optional(),
  promotionBudget: z.number().optional(),
  pointPerUnit: z.number().int().min(0).optional(),
  freeItems: z
    .array(
      z.object({
        id: z.string().optional(),
        purchaseQty: z.number().min(1),
        freeQty: z.number().min(0),
        netPrice: z.number().optional(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
  promotionItems: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        quantity: z.number().min(0),
        price: z.number().optional(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
  stockLots: z
    .array(
      z.object({
        id: z.string().optional(),
        lotNumber: z.string().optional(), // เลข LOT ที่ผู้ใช้กรอก
        quantity: z.number().min(0),
        initialQuantity: z.number().min(0).optional(),
        importDate: z.string().or(z.date()),
        expiryDate: z.string().or(z.date()).optional(),
        storageLocation: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
});

export type ProductManagementFormValues = z.infer<
  typeof productManagementSchema
>;
