import { db } from "@/lib/db";
import { ShipmentRepository } from "../infrastructure/shipment.repository";

export async function deleteShipmentUseCase(shipmentId: string, userId: string) {
  const shipment = await ShipmentRepository.getShipmentById(shipmentId);
  if (!shipment) throw new Error("ไม่พบการจัดส่ง");

  if (shipment.status !== "PENDING") {
    throw new Error("ไม่สามารถลบการจัดส่งที่เริ่มดำเนินการไปแล้วได้ กรุณายกเลิกแทน");
  }

  await db.$transaction(async (tx) => {
    await ShipmentRepository.deleteShipment(shipmentId, tx);
  });

  return { success: true };
}
