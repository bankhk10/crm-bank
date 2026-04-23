import { generatePdfFromHtml } from "../server/pdf-service";
import {
  renderShipmentDeliveryTemplate,
  type ShipmentDeliveryData,
} from "../templates/shipment-delivery-template";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { db } from "@/lib/db";
import { formatAddress } from "@/lib/address-utils";

function safeFormatDate(d: Date | string | null | undefined, fmt = "d MMMM yyyy") {
  if (!d) return "-";
  try {
    const date = new Date(d);
    const year = date.getFullYear() + 543;
    const fmtBE = fmt.replace("yyyy", year.toString());
    return format(date, fmtBE, { locale: th });
  } catch {
    return "-";
  }
}

const SHIPMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  IN_TRANSIT: "ระหว่างขนส่ง",
  DELIVERED: "ส่งเสร็จแล้ว",
  CANCELLED: "ยกเลิก",
};

/**
 * สร้าง PDF ใบจัดส่งสินค้า (Delivery Note) สำหรับ Shipment ที่ระบุ
 */
export async function createShipmentDeliveryNotePdf(
  shipmentId: string,
): Promise<Buffer> {
  // ดึงข้อมูล Shipment พร้อม relations ที่ต้องการ
  const shipment = await db.shipment.findUnique({
    where: { id: shipmentId },
    include: {
      items: {
        include: {
          saleItem: {
            select: {
              id: true,
              productCode: true,
              name: true,
              unit: true,
              quantity: true,
            },
          },
        },
      },
      shippingCompany: {
        select: { id: true, name: true, phone: true },
      },
      sale: {
        select: {
          id: true,
          saleNumber: true,
          saleOrderRef: true,
          customer: {
            select: {
              id: true,
              name: true,
              customerCode: true,
              phone: true,
              addressLine: true,
              subdistrict: true,
              district: true,
              province: true,
              postalCode: true,
            },
          },
        },
      },
    },
  });

  if (!shipment) {
    throw new Error(`Shipment ${shipmentId} not found`);
  }

  const { sale } = shipment;
  const customer = sale.customer;

  const customerAddress = formatAddress({
    addressLine: customer?.addressLine,
    subdistrict: customer?.subdistrict,
    district: customer?.district,
    province: customer?.province,
    postalCode: customer?.postalCode,
  });

  const deliveryData: ShipmentDeliveryData = {
    saleNumber: sale.saleNumber || "-",
    saleOrderRef: sale.saleOrderRef,
    shipmentNumber: shipment.shipmentNumber,
    scheduledDate: safeFormatDate(shipment.scheduledDate),
    actualDate: safeFormatDate(shipment.actualDate),
    shipmentStatus: SHIPMENT_STATUS_LABEL[shipment.status] || shipment.status,
    customerName: customer?.name || "-",
    customerCode: customer?.customerCode || "-",
    customerPhone: customer?.phone || "-",
    customerAddress: customerAddress || "-",
    shippingCompanyName: shipment.shippingCompany?.name || "-",
    items: shipment.items.map((si) => ({
      productCode: si.saleItem.productCode || "-",
      productName: si.saleItem.name || "-",
      quantity: si.quantity,
      unit: si.saleItem.unit || "-",
      unitPrice: Number(si.unitPrice ?? 0),
      totalPrice: Number(si.totalPrice ?? 0),
    })),
    totalAmount: Number(shipment.totalAmount ?? 0),
    notes: shipment.notes,
    printedDate: safeFormatDate(new Date()),
  };


  const html = renderShipmentDeliveryTemplate(deliveryData);
  return generatePdfFromHtml(html);
}
