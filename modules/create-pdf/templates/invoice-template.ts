import fs from "fs";
import path from "path";

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerAddress: string;
  items: {
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

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td class="col-desc">${item.description}</td>
      <td class="col-center">${item.quantity}</td>
      <td class="col-right">${item.price.toLocaleString()} THB</td>
      <td class="col-right fw-bold">${item.total.toLocaleString()} THB</td>
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
        body {
          font-family: 'Sarabun', sans-serif; /* รองรับภาษาไทยได้สมบูรณ์ */
          color: #333;
          margin: 0;
          padding: 0;
          background: #fff;
          font-size: 14px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #2c3e50;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #2c3e50;
          margin: 0;
          font-size: 28px;
          text-transform: uppercase;
        }
        .header .company-logo {
          max-height: 50px; /* ปรับขนาด Logo ตามต้องการ */
          object-fit: contain;
        }
        .customer-info-container {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .customer-details, .invoice-details {
          width: 48%;
          padding: 15px;
          border-radius: 6px;
          background-color: #f8f9fa;
        }
        .logistics-details {
          width: 100%;
          padding: 15px;
          border-radius: 6px;
          background-color: #f8f9fa;
          margin-bottom: 25px;
          box-sizing: border-box;
        }
        h3 {
          margin-top: 0;
          color: #444;
          font-size: 16px;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 5px;
        }
        p {
          margin: 5px 0;
          line-height: 1.5;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        thead {
          display: table-header-group; /* ทำให้ Header ซ้ำทุกหน้า (Repeating Header) */
        }
        tr {
          page-break-inside: avoid; /* ห้ามให้ Row แตกครึ่งหน้า (Row break prevent) */
        }
        th {
          background-color: #2c3e50;
          color: white;
          padding: 12px 10px;
          text-align: left;
        }
        td {
          padding: 12px 10px;
          border-bottom: 1px solid #dee2e6;
        }
        .col-desc { text-align: left; }
        .col-center { text-align: center; }
        .col-right { text-align: right; }
        .fw-bold { font-weight: 600; }
        
        .total-section {
          width: 40%;
          float: right;
          border: 1px solid #dee2e6;
          border-radius: 6px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 15px;
          border-bottom: 1px solid #dee2e6;
        }
        .total-row:last-child {
          border-bottom: none;
        }
        .grand-total {
          background-color: #2c3e50;
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
        
        .footer-section {
          page-break-inside: avoid; /* ห้าม Footer แตกครึ่งหน้า */
        }

        .footer {
          clear: both;
          padding-top: 80px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
        .signature-box {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
        }
        .signature {
          text-align: center;
          width: 200px;
        }
        .signature div {
          border-top: 1px solid #333;
          margin-top: 50px;
          padding-top: 10px;
        }
          .doc-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  margin-bottom: 10px;
}

.company {
  display: flex;
  gap: 14px;
}

.company-logo {
  width: 90px;
}

.company-text h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.company-text p {
  margin: 2px 0;
  font-size: 13px;
  color: #555;
}

.doc-meta {
  text-align: right;
}

.doc-meta .label {
  color: #777;
  font-size: 13px;
}

.doc-meta .doc-no {
  font-size: 22px;
  font-weight: 700;
  color: #24364b;
}

.doc-title {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  margin: 30px 0 10px;
  color: #24364b;
}

.doc-divider {
  height: 3px;
  background: #24364b;
  margin-bottom: 25px;
}
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
      
      <div class="customer-info-container">
        <div class="customer-details">
          <h3>ข้อมูลลูกค้า</h3>
          <p><strong>ชื่อบริษัท:</strong> ${data.customerName}</p>
          <p><strong>ที่อยู่บริษัท:</strong> ${data.customerAddress}</p>
          <p><strong>ที่อยู่วางบิล:</strong> ${data.customerAddress}</p>
          <p><strong>เบอร์โทรศัพท์:</strong> ${"081-234-5678"}</p>
        </div>
        <div class="invoice-details">
          <h3>ข้อมูลอ้างอิง</h3>
          <p><strong>เลขที่ใบแจ้งหนี้:</strong> ${data.invoiceNumber}</p>
          <p><strong>วันที่ออกเอกสาร:</strong> ${data.date}</p>
          <p><strong>เงื่อนไขการชำระเงิน:</strong> 30 วัน</p>
        </div>
      </div>
         <div class="logistics-details">
          <h3>ข้อมูลการจัดส่ง</h3>
          <p><strong>วิธีการจัดส่ง:</strong> ${data.invoiceNumber}</p>
          <p><strong>ที่อยู่จัดส่งสินค้า:</strong> ${data.date}</p>
          <p><strong>ที่อยู่รับสินค้า:</strong> 30 วัน</p>
          <p><strong>ชื่อบริษัทขนส่ง:</strong> 30 วัน</p>
          <p><strong>ที่อยู่บริษัทขนส่ง:</strong> 30 วัน</p>
        </div>

      <table>
        <thead>
          <tr>
            <th class="col-desc">รายละเอียดสินค้า/บริการ (Description)</th>
            <th class="col-center" style="width: 10%;">จำนวน (Qty)</th>
            <th class="col-right" style="width: 20%;">ราคาต่อหน่วย (Unit Price)</th>
            <th class="col-right" style="width: 20%;">จำนวนเงินรวม (Amount)</th>
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
