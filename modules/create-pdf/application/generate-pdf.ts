import { generatePdfFromHtml } from "../server/pdf-service";
import {
  renderInvoiceTemplate,
  InvoiceData,
} from "../templates/invoice-template";
import { format } from "date-fns";
import { th } from "date-fns/locale";

/**
 * สร้าง PDF จากข้อมูลการขายจริง
 */
export async function createPdfFromSaleData(sale: any): Promise<Buffer> {
  const customerAddress = [
    sale.customer.addressLine,
    sale.customer.subdistrict ? `ต.${sale.customer.subdistrict}` : "",
    sale.customer.district ? `อ.${sale.customer.district}` : "",
    sale.customer.province ? `จ.${sale.customer.province}` : "",
    sale.customer.postalCode,
  ]
    .filter(Boolean)
    .join(" ");

  const invoiceData: InvoiceData = {
    invoiceNumber: sale.saleNumber,
    date: format(new Date(sale.saleDate), "dd MMMM yyyy", { locale: th }),
    customerName: sale.customer.name,
    customerAddress: customerAddress || "-",
    contactName: sale.employee?.name || "-",
    items: sale.items.map((item: any) => ({
      code: item.product.code || "-",
      description: item.product.name,
      quantity: item.quantity,
      price: Number(item.unitPrice),
      total: Number(item.totalPrice),
    })),
    totalAmount: Number(sale.totalAmount),
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
