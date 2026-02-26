import fs from "fs";
import path from "path";

export interface InvoiceData {
  invoiceNumber: string;
  date: string; // Sale Date
  customerName: string;
  customerPhone: string;
  customerAddress: string; // Main address or Company Address depending on context
  billingAddress: string;

  deliveryMethod: string;
  shippingAddress: string;
  receivingAddress: string;
  shippingCompanyName: string;
  senderAddress: string;

  paymentTerm: string;
  deliveryDate: string;
  creditDueDate: string;
  paymentDate: string;

  items: {
    code: string;
    description: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  contactName: string;
  totalAmount: number;
  title: string;
}

/**
 * Render Sample HTML Template for Invoice
 * @param data Object containing invoice info
 * @returns HTML string representation of the invoice
 */
export function renderInvoiceTemplate(data: InvoiceData): string {
  // Read localized image as base64 strings so puppeteer can easily render it offline / headless without issues.
  const logoPath = path.join(process.cwd(), "public", "images", "logo_pdf.png");
  let base64Logo = "";
  if (fs.existsSync(logoPath)) {
    const bitmap = fs.readFileSync(logoPath);
    base64Logo = "data:image/png;base64," + bitmap.toString("base64");
  }

  // Read CSS from file
  const cssPath = path.join(
    process.cwd(),
    "modules",
    "create-pdf",
    "templates",
    "invoice.css",
  );
  let cssContent = "";
  if (fs.existsSync(cssPath)) {
    cssContent = fs.readFileSync(cssPath, "utf-8");
  }

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td class="col-center">${item.code}</td>
      <td class="col-desc">${item.description}</td>
      <td class="col-center">${item.quantity}</td>
      <td class="col-center">${"-" /* บรรจุ */}</td>
      <td class="col-right">${item.price.toLocaleString()}</td>
      <td class="col-right">${"-" /* ราคา/ลัง */}</td>
      <td class="col-right fw-bold">${item.total.toLocaleString()}</td>
    </tr>
  `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>เลขที่ออเดอร์ - ${data.invoiceNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        ${cssContent}
      </style>
    </head>
    <body>
<div class="page">
   <div class="doc-header">
  <div class="company">
    ${base64Logo ? `<img src="${base64Logo}" class="company-logo" />` : ""}

    <div class="company-text">
      <h2>บริษัท คร็อพ ซายน์ จำกัด</h2>
      <p>Crop Sciences CO., LTD.</p>
      <p>เลขที่ 22 อาคารไอซี ถนนพระรามที่ 6 แขวงพญาไท เขตพญาไท กรุงเทพฯ 10400</p>
      <p>โทร. 02-271-4343 แฟกซ์: 02-618-4530</p>
    </div>
  </div>

  <div class="doc-meta">
    <div class="label">เลขที่เอกสาร</div>
    <div class="doc-no">${data.invoiceNumber}</div>
    <div class="label">วันที่: ${data.date}</div>
  </div>

</div>

<div class="doc-title">${data.title}</div>
<div class="doc-divider"></div>
      <div class="customer-details">
        <h3>ข้อมูลลูกค้า</h3>
       <p>
  <strong>ชื่อบริษัท:</strong> ${data.customerName}
  <span class="phone"><strong>เบอร์โทรศัพท์:</strong> ${data.customerPhone}</span>
    </p>
        <p><strong>ที่อยู่บริษัท:</strong> ${data.customerAddress}</p>
        <p><strong>ที่อยู่วางบิล:</strong> ${data.billingAddress}</p>
      </div>
      <div class="customer-info-container">
        <div class="logistics-details">
          <h3>ข้อมูลการจัดส่ง</h3>
          <p><strong>วิธีการจัดส่ง:</strong> ${data.deliveryMethod}</p>
          <p><strong>ที่อยู่จัดส่งสินค้า:</strong> ${data.shippingAddress}</p>
          <p><strong>ที่อยู่รับสินค้า:</strong> ${data.receivingAddress}</p>
          <p><strong>ชื่อบริษัทขนส่ง:</strong> ${data.shippingCompanyName}</p>
          <p><strong>ที่อยู่บริษัทขนส่ง:</strong> ${data.senderAddress}</p>
        </div>
        <div class="invoice-details">
          <h3>ข้อมูลอ้างอิง</h3>
          <p><strong>วันที่:</strong> ${data.date}</p>
          <p><strong>เลขที่ออเดอร์:</strong> ${data.invoiceNumber}</p>
          <p><strong>เงื่อนไขการชำระเงิน:</strong> ${data.paymentTerm}</p>
          <p><strong>วันที่จัดส่ง:</strong> ${data.deliveryDate}</p>
          <p><strong>วันที่ครบกำหนดชำระเงิน:</strong> ${data.creditDueDate}</p>
          <p><strong>วันที่ชำระเงิน:</strong> ${data.paymentDate}</p>
          <p><strong>ผู้ขาย:</strong> ${data.contactName}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="col-center" style="width: 10%;">รหัสสินค้า</th>
            <th class="col-desc">รายละเอียดสินค้า</th>
            <th class="col-center" style="width: 5%;">จำนวน</th>
            <th class="col-center" style="width: 5%;">บรรจุ</th>
            <th class="col-center" style="width: 10%;">ราคา/หน่วย</th>
            <th class="col-center" style="width: 5%;">ราคา/ลัง</th>
            <th class="col-right" style="width: 20%;">จำนวนเงินรวม</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="footer-section">
        <div class="total-section">
          <div class="total-row">
            <span>รวมเป็นเงิน (Subtotal):</span>
          <span>${data.totalAmount.toLocaleString()} THB</span>
        </div>
        <div class="total-row">
          <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
          <span>${(data.totalAmount * 0.07).toLocaleString()} THB</span>
        </div>
        <div class="total-row grand-total">
          <span>ยอดรวมทั้งสิ้น (Grand Total):</span>
          <span>${(data.totalAmount * 1.07).toLocaleString()} THB</span>
        </div>
      </div>

      <div class="footer">
        <div class="signature-box">
          <div class="signature">
            <div>ผู้รับวางบิล / Received By</div>
          </div>
          <div class="signature">
            <div>ผู้อนุมัติ / Authorized Signature</div>
          </div>
      </div>
      </div>
    </body>
    </html>
  `;
}
