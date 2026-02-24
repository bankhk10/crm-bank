import { FulfillmentRepository } from "../infrastructure/fulfillment.repository";
import { updateFulfillmentSchema } from "./validations";

export async function updateFulfillmentUseCase(
  id: string,
  userId: string,
  input: unknown,
) {
  const validatedData = updateFulfillmentSchema.parse(input);

  // Fetch the existing sale to perform additional validations
  const sale = await FulfillmentRepository.getSaleForFulfillment(id);
  if (!sale) {
    throw new Error("Sale not found");
  }

  // Business Logic: DELIVERED or DELIVERY_COMPLETED requires delivery date
  if (
    validatedData.status === "DELIVERED" ||
    validatedData.status === "DELIVERY_COMPLETED"
  ) {
    const finalDeliveryDate =
      validatedData.deliveryDate !== undefined
        ? validatedData.deliveryDate
        : sale.deliveryDate;
    if (!finalDeliveryDate) {
      throw new Error(
        `กรุณาระบุวันที่จัดส่งสินค้าเมื่อสถานะเป็น '${validatedData.status === "DELIVERED" ? "ระหว่างขนส่ง" : "ส่งเสร็จแล้ว"}'`,
      );
    }
  }

  return FulfillmentRepository.updateFulfillment(id, {
    ...validatedData,
    deliveryDate:
      validatedData.deliveryDate === undefined
        ? undefined
        : validatedData.deliveryDate
          ? new Date(validatedData.deliveryDate)
          : null,
    creditDueDate:
      validatedData.creditDueDate === undefined
        ? undefined
        : validatedData.creditDueDate
          ? new Date(validatedData.creditDueDate)
          : null,
    paymentDate:
      validatedData.paymentDate === undefined
        ? undefined
        : validatedData.paymentDate
          ? new Date(validatedData.paymentDate)
          : null,
    changedById: userId,
  });
}
