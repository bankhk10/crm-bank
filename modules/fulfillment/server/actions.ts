"use server";

import { auth } from "@/modules/auth/infrastructure/next-auth";
import { revalidatePath } from "next/cache";
import {
  updateFulfillmentUseCase,
  getLotOptionsUseCase,
  createShipmentUseCase,
  updateShipmentUseCase,
  getShipmentsUseCase,
  getShipmentByIdUseCase,
} from "../application";
import { findSales } from "@/modules/sales/infrastructure/sale.repository";
import { createShipmentDeliveryNotePdf } from "@/modules/create-pdf/application/generate-shipment-pdf";


// Helper to convert Prisma.Decimal objects to numbers, as they are not supported by Server Actions
function serializeData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj;
  if (
    typeof obj.toNumber === "function" &&
    typeof obj.toFixed === "function" &&
    "d" in obj
  ) {
    return obj.toNumber();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeData);
  }
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = serializeData(value);
  }
  return result;
}

export async function updateFulfillmentAction(id: string, payload: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const sale = await updateFulfillmentUseCase(id, session.user.id, payload);

    revalidatePath(`/sales/${id}`);
    revalidatePath("/fulfillment");
    revalidatePath("/sales");

    return { success: true, saleId: sale.id };
  } catch (error) {
    console.error("updateFulfillment object:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update fulfillment",
    };
  }
}

export async function getLotOptionsAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const data = await getLotOptionsUseCase(id);
    if (!data) {
      return { success: false, error: "Sale not found" };
    }
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching lot options:", error);
    return { success: false, error: "Failed to fetch lot options" };
  }
}

export async function getFulfillmentsAction(params: {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const result = await findSales({
      page: params.page,
      perPage: params.perPage,
      search: params.search,
      status: params.status as any,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });

    return {
      success: true,
      sales: serializeData(result.sales),
      total: result.total,
    };
  } catch (error) {
    console.error("Error fetching fulfillments", error);
    throw new Error("Failed to fetch fulfillments");
  }
}

// ──────────────────────────────────────────────────
// Split Shipment Actions
// ──────────────────────────────────────────────────

export async function getShipmentsAction(saleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const data = await getShipmentsUseCase(saleId);
    return { success: true, data: serializeData(data) };
  } catch (error) {
    console.error("getShipmentsAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get shipments",
    };
  }
}

export async function createShipmentAction(saleId: string, payload: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const shipment = await createShipmentUseCase(saleId, session.user.id, payload);
    revalidatePath(`/fulfillment/${saleId}`);
    revalidatePath("/fulfillment");
    return { success: true, data: serializeData(shipment) };
  } catch (error) {
    console.error("createShipmentAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create shipment",
    };
  }
}

export async function updateShipmentAction(shipmentId: string, payload: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const shipment = await updateShipmentUseCase(shipmentId, session.user.id, payload);
    if (shipment?.sale?.id) {
      revalidatePath(`/fulfillment/${shipment.sale.id}`);
      revalidatePath("/fulfillment");
    }
    return { success: true, data: serializeData(shipment) };
  } catch (error) {
    console.error("updateShipmentAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update shipment",
    };
  }
}

export async function generateShipmentPdfAction(shipmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const pdfBuffer = await createShipmentDeliveryNotePdf(shipmentId);
    // Return base64 เพราะ Buffer ไม่สามารถส่งผ่าน Server Action ได้โดยตรง
    return { success: true, pdfBase64: pdfBuffer.toString("base64") };
  } catch (error) {
    console.error("generateShipmentPdfAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate PDF",
    };
  }
}

