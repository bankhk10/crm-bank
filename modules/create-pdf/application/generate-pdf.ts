import { generatePdfFromHtml } from "../server/pdf-service";
import {
  renderInvoiceTemplate,
  sampleInvoiceData,
} from "../templates/invoice-template";

/**
 * ใช้งานข้อมูลตัวอย่างเพื่อสร้าง PDF
 * @returns PDF Buffer
 */
export async function createSamplePdf(): Promise<Buffer> {
  // 1. นำข้อมูลตัวอย่างไปใส่ใน HTML Template
  const html = renderInvoiceTemplate(sampleInvoiceData);

  // 2. ส่ง HTML ไปให้ Puppeteer แปลงเป็น PDF
  const pdfBuffer = await generatePdfFromHtml(html);

  return pdfBuffer;
}

/**
 * สร้าง PDF จากข้อมูลและ Template อื่นๆ (สามารถขยายได้ในอนาคต)
 */
export async function createPdfFromHtmlString(
  htmlContent: string,
): Promise<Buffer> {
  return generatePdfFromHtml(htmlContent);
}
