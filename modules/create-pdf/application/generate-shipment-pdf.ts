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

import { findSaleById } from "@/modules/sales/infrastructure/sale.repository";
import { PaymentTermLabels } from "@/modules/sales/types";

const DELIVERY_METHOD_MAP: Record<string, string> = {
  SALES_DELIVERY: "พนักงานขายจัดส่งสินค้า",
  FACTORY_DELIVERY: "ส่งโดยรถโรงงาน",
  CUSTOMER_PICKUP: "ลูกค้ามารับสินค้าเอง",
  COURIER: "ส่งโดยบริษัทขนส่ง",
};

/**
 * สร้าง PDF ใบจัดส่งสินค้า (Delivery Note) สำหรับ Shipment ที่ระบุ
 */
export async function createShipmentDeliveryNotePdf(
  shipmentId: string,
): Promise<Buffer> {
  const shipment = await db.shipment.findUnique({
    where: { id: shipmentId },
    include: {
      items: {
        include: {
          saleItem: {
            include: {
              product: true,
            }
          },
        },
      },
      shippingCompany: {
        select: { id: true, name: true, phone: true },
      },
    },
  });

  if (!shipment) {
    throw new Error(`Shipment ${shipmentId} not found`);
  }

  const sale = await findSaleById(shipment.saleId);
  if (!sale) {
    throw new Error(`Sale ${shipment.saleId} not found`);
  }

  const sa = sale.saleAddress || {} as any;

  const allShipments = await db.shipment.findMany({
    where: { 
      saleId: shipment.saleId, 
      status: { not: "CANCELLED" },
      shipmentNumber: { lte: shipment.shipmentNumber }
    },
    include: { items: true },
  });

  const pendingItems = sale.items.map((si: any) => {
    const shippedQty = allShipments.reduce((sum, sh) => {
      const shItem = sh.items.find((i: any) => i.saleItemId === si.id);
      return sum + (shItem ? shItem.quantity : 0);
    }, 0);
    return {
      description: si.product?.name || si.name || "-",
      pendingQty: si.quantity - shippedQty,
    };
  }).filter((item: any) => item.pendingQty > 0);

  const customerAddress = sa.address_line
    ? formatAddress({
      addressLine: sa.address_line,
      subdistrict: sa.address_subdistrict,
      district: sa.address_district,
      province: sa.address_province,
      postalCode: sa.address_code,
    })
    : formatAddress({
      addressLine: sale.customer?.addressLine,
      subdistrict: sale.customer?.subdistrict,
      district: sale.customer?.district,
      province: sale.customer?.province,
      postalCode: sale.customer?.postalCode,
    });

  const billingAddress = sa.billing_address_line
    ? formatAddress({
      addressLine: sa.billing_address_line,
      subdistrict: sa.billing_subdistrict,
      district: sa.billing_district,
      province: sa.billing_province,
      postalCode: sa.billing_postal_code,
    })
    : customerAddress;

  const shippingAddress = formatAddress({
    addressLine: sa.shipping_address_line,
    subdistrict: sa.shipping_subdistrict,
    district: sa.shipping_district,
    province: sa.shipping_province,
    postalCode: sa.shipping_postal_code,
  });

  const receivingAddress = formatAddress({
    addressLine: sa.receiving_address_line,
    subdistrict: sa.receiving_subdistrict,
    district: sa.receiving_district,
    province: sa.receiving_province,
    postalCode: sa.receiving_postal_code,
  });

  const senderAddress = formatAddress({
    addressLine: sa.sender_line,
    subdistrict: sa.sender_subdistrict,
    district: sa.sender_district,
    province: sa.sender_province,
    postalCode: sa.sender_postal_code,
  });

  const deliveryData: any = {
    invoiceNumber: sale.saleNumber || "-",
    saleOrderRef: shipment.salesOrderNumber || sale.saleOrderRef,
    shipmentNumber: shipment.shipmentNumber,
    date: safeFormatDate(sale.saleDate, "d MMMM yyyy"),
    customerName: sa.company_name || sale.customer?.name || "-",
    customerCode: sale.customer?.customerCode || "-",
    customerPhone: sa.company_phone || sale.customer?.phone || "-",
    customerAddress: customerAddress || "-",
    billingAddress: billingAddress || "-",

    deliveryMethod:
      DELIVERY_METHOD_MAP[sale.deliveryMethod as string] || sale.deliveryMethod || "-",
    deliveryMethodRaw: sale.deliveryMethod || "-",
    shippingAddress: shippingAddress || "-",
    receivingAddress: receivingAddress || "-",
    shippingCompanyName: shipment.shippingCompany?.name || sa.sender_name || "-",
    senderAddress: senderAddress || "-",
    requestedDeliveryDate: safeFormatDate(sale.requestedDeliveryDate, "d MMMM yyyy"),
    shippingCustomerAddressId: sa.shippingCustomerAddressId || "-",

    paymentTerm:
      PaymentTermLabels[sale.paymentTerm as keyof typeof PaymentTermLabels] ||
      sale.paymentTerm ||
      "-",
    deliveryDate: safeFormatDate(shipment.scheduledDate || sale.deliveryDate, "d MMMM yyyy"),
    dueDate: safeFormatDate(shipment.dueDate, "d MMMM yyyy"),
    paymentDate: safeFormatDate(shipment.paymentDate, "d MMMM yyyy"),

    contactName: sale.employee?.name || "-",
    items: shipment.items.map((si) => {
      const packageSize = Number(si.saleItem.packageSizePerBox || si.saleItem.product?.packageSizePerBox || 1);
      const unitPrice = Number(si.unitPrice ?? 0);
      const cartonPrice = unitPrice * packageSize;
      return {
        code: si.saleItem.productCode || "-",
        description: si.saleItem.name || "-",
        quantity: si.quantity,
        unit: si.saleItem.unit || "-",
        packageSizePerBox: packageSize,
        price: unitPrice,
        cartonPrice: cartonPrice,
        total: Number(si.totalPrice ?? 0),
        promotionBudget: Number(si.saleItem.promotionBudget || 0),
      };
    }),
    subtotalAmount: shipment.items.reduce((sum, si) => sum + Number(si.totalPrice ?? 0), 0),
    shippingDiscount: Number(shipment.shippingDiscount ?? 0),
    billDiscount: Number(shipment.billDiscount ?? 0),
    otherCostsDescription: sale.otherCostsDescription,
    totalAmount: Number(shipment.totalAmount ?? 0),
    promotionalBudgetTotal: shipment.items.reduce((sum, si) => {
      return sum + (Number(si.quantity || 0) * Number(si.saleItem.promotionBudget || 0));
    }, 0),
    budgetDetails: (sale.budgetDetails || []).map((budget: any) => ({
      type: budget.type,
      amount: Number(budget.usedAmount || budget.receivedAmount || 0),
      description: budget.description,
    })),
    title: "ใบจัดส่งสินค้า",
    status: shipment.status,
    notes: shipment.notes,
    preparedBySignatureDate: safeFormatDate(sale.preparedBySignatureDate, "d MMMM yyyy"),
    preparedBySignatureImage: sale.preparedBySignatureImage,
    checkedBySignatureDate: safeFormatDate(sale.checkedBySignatureDate, "d MMMM yyyy"),
    checkedBySignatureImage: sale.checkedBySignatureImage,
    approvedBySignatureDate: safeFormatDate(sale.approvedBySignatureDate, "d MMMM yyyy"),
    approvedBySignatureImage: sale.approvedBySignatureImage,
    approvedByName: sale.approvedBy?.name || "-",
    pendingItems,
  };

  const html = renderShipmentDeliveryTemplate(deliveryData as unknown as ShipmentDeliveryData);
  return generatePdfFromHtml(html);
}
