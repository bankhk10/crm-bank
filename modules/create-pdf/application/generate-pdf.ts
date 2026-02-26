import { generatePdfFromHtml } from "../server/pdf-service";
import {
  renderInvoiceTemplate,
  InvoiceData,
} from "../templates/invoice-template";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import { buildFullAddress } from "@/modules/sales/application/address-utils";

function safeFormatDate(d: Date | string | null | undefined, fmt: string) {
  if (!d) return "-";
  try {
    return format(new Date(d), fmt, { locale: th });
  } catch (e) {
    return "-";
  }
}

const DELIVERY_METHOD_MAP: Record<string, string> = {
  SALES_DELIVERY: "พนักงานขายจัดส่งสินค้า",
  FACTORY_DELIVERY: "ส่งโดยรถโรงงาน",
  CUSTOMER_PICKUP: "ลูกค้ามารับสินค้าเอง",
  COURIER: "ส่งโดยบริษัทขนส่ง",
};

/**
 * สร้าง PDF จากข้อมูลการขายจริง
 */
export async function createPdfFromSaleData(sale: any): Promise<Buffer> {
  const sa = sale.saleAddress || {};

  const customerAddress = sa.address_line
    ? buildFullAddress(
        sa.address_line,
        sa.address_subdistrict,
        sa.address_district,
        sa.address_province,
        sa.address_code,
      )
    : buildFullAddress(
        sale.customer?.addressLine,
        sale.customer?.subdistrict,
        sale.customer?.district,
        sale.customer?.province,
        sale.customer?.postalCode,
      );

  const billingAddress = sa.billing_address_line
    ? buildFullAddress(
        sa.billing_address_line,
        sa.billing_subdistrict,
        sa.billing_district,
        sa.billing_province,
        sa.billing_postal_code,
      )
    : customerAddress;

  const shippingAddress = buildFullAddress(
    sa.shipping_address_line,
    sa.shipping_subdistrict,
    sa.shipping_district,
    sa.shipping_province,
    sa.shipping_postal_code,
  );

  const receivingAddress = buildFullAddress(
    sa.receiving_address_line,
    sa.receiving_subdistrict,
    sa.receiving_district,
    sa.receiving_province,
    sa.receiving_postal_code,
  );

  const senderAddress = buildFullAddress(
    sa.sender_line,
    sa.sender_subdistrict,
    sa.sender_district,
    sa.sender_province,
    sa.sender_postal_code,
  );

  const invoiceData: InvoiceData = {
    invoiceNumber: sale.saleNumber || "-",
    date: safeFormatDate(sale.saleDate, "dd MMMM yyyy"),
    customerName: sa.company_name || sale.customer?.name || "-",
    customerPhone: sa.company_phone || sale.customer?.phone || "-",
    customerAddress: customerAddress || "-",
    billingAddress: billingAddress || "-",

    deliveryMethod:
      DELIVERY_METHOD_MAP[sale.deliveryMethod] || sale.deliveryMethod || "-",
    shippingAddress: shippingAddress || "-",
    receivingAddress: receivingAddress || "-",
    shippingCompanyName: sa.sender_name || sale.shippingCompany?.name || "-",
    senderAddress: senderAddress || "-",

    paymentTerm: sale.paymentTerm || "-",
    deliveryDate: safeFormatDate(sale.deliveryDate, "dd MMMM yyyy"),
    creditDueDate: safeFormatDate(sale.creditDueDate, "dd MMMM yyyy"),
    paymentDate: "-", // Not natively mapped yet in Sale

    contactName: sale.employee?.name || "-",
    items: (sale.items || []).map((item: any) => ({
      code: item.product?.productCode || item.productCode || "-",
      description: item.product?.name || item.name || "-",
      quantity: item.quantity || 0,
      price: Number(item.unitPrice || 0),
      total: Number(item.totalPrice || 0),
    })),
    totalAmount: Number(sale.totalAmount || 0),
    title: sale.status === "COMPLETED" ? "ใบบันทึกการขาย" : "ใบเสนอราคา",
  };

  const html = renderInvoiceTemplate(invoiceData);
  return generatePdfFromHtml(html);
}

/**
 * สร้าง PDF จากข้อมูลและ Template อื่นๆ (สามารถขยายได้ในอนาคต)
 */
export async function createPdfFromHtmlString(
  htmlContent: string,
): Promise<Buffer> {
  return generatePdfFromHtml(htmlContent);
}
