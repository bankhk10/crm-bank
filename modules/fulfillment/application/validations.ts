import { z } from "zod";
import { SaleStatus } from "@/lib/db";

export const ObjectWithStatuses = z.object({
  status: z.nativeEnum(SaleStatus).optional(),
  deliveryDate: z.string().nullable().optional(),
  creditDueDate: z.string().nullable().optional(),
  paymentDate: z.string().nullable().optional(),
  managerNotes: z.string().optional(),
  lotAllocations: z
    .array(
      z.object({
        saleItemId: z.string(),
        lotId: z.string(),
        quantity: z.number().positive(),
      }),
    )
    .optional(),
  shippingCompanyId: z.string().nullable().optional(),
  saleOrderRef: z.string().nullable().optional(),
  hasPartialDelivery: z.boolean().optional(),
});

export const updateFulfillmentSchema = ObjectWithStatuses.refine(
  (data) => {
    if (data.status === "CANCELLED" && (!data.managerNotes || !data.managerNotes.trim())) {
      return false;
    }
    return true;
  },
  {
    message: "กรุณาระบุหมายเหตุเมื่อยกเลิกรายการขาย",
    path: ["managerNotes"],
  },
);

export type UpdateFulfillmentInput = z.infer<typeof updateFulfillmentSchema>;
