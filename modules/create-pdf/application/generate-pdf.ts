import { generatePdfFromHtml } from "../server/pdf-service";
import {
  renderInvoiceTemplate,
  InvoiceData,
} from "../templates/invoice-template";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import { formatAddress } from "@/lib/address-utils";

import { PaymentTermLabels } from "@/modules/sales/types";

function safeFormatDate(d: Date | string | null | undefined, fmt: string) {
  if (!d) return "-";
  try {
    const date = new Date(d);
    const year = date.getFullYear() + 543;
    const fmtWithBE = fmt.replace("yyyy", year.toString());
    return format(date, fmtWithBE, { locale: th });
  } catch {
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

  const invoiceData: InvoiceData = {
    invoiceNumber: sale.saleNumber || "-",
    saleOrderRef: sale.saleOrderRef,
    date: safeFormatDate(sale.saleDate, "d MMMM yyyy"),
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

    paymentTerm:
      PaymentTermLabels[sale.paymentTerm as keyof typeof PaymentTermLabels] ||
      sale.paymentTerm ||
      "-",
    deliveryDate: safeFormatDate(sale.deliveryDate, "d MMMM yyyy"),
    creditDueDate: safeFormatDate(sale.creditDueDate, "d MMMM yyyy"),
    paymentDate: "-", // Not natively mapped yet in Sale

    contactName: sale.employee?.name || "-",
    items: (sale.items || []).map((item: any) => ({
      code: item.productCode || item.product?.productCode || "-",
      packageSizePerBox: Number(
        item.packageSizePerBox || item.product?.packageSizePerBox || 1,
      ),
      description: item.name || item.product?.name || "-",
      quantity: item.quantity || 0,
      unit: item.unit || item.product?.unit || "-",
      price: Number(item.unitPrice || 0),
      cartonPrice: Number(item.cartonPrice || 0),
      total: Number(item.totalPrice || 0),
    })),
    subtotalAmount: Number(sale.subtotalAmount || 0),
    shippingDiscount: Number(sale.shippingCost || 0),
    billDiscount: Number(sale.otherCosts || 0),
    totalAmount: Number(sale.totalAmount || 0),
    title: "ใบบันทึกการขาย",
    status: sale.status,
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
