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
}

// ข้อมูลตัวอย่างสำหรับใช้ทดสอบการสร้าง PDF (Sample Data)
export const sampleInvoiceData: InvoiceData = {
  invoiceNumber: "INV-2023-00123",
  date: "2023-11-01",
  customerName: "บริษัท ไทยเทคโนโลยี จำกัด",
  customerAddress:
    "123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110",
  contactName: "คุณสมชาย ใจดี",
  items: [
    {
      description: "บริการพัฒนาซอฟต์แวร์ (เดือนตุลาคม)",
      quantity: 1,
      price: 55000,
      total: 55000,
    },
    {
      description: "ค่าบริการคลาวด์เซิฟเวอร์",
      quantity: 1,
      price: 15000,
      total: 15000,
    },
    {
      description: "ค่าที่ปรึกษาด้านความปลอดภัย",
      quantity: 10,
      price: 1200,
      total: 12000,
    },
  ],
  totalAmount: 82000,
};

/**
 * Render Sample HTML Template for Invoice
 * @param data Object containing invoice info
 * @returns HTML string representation of the invoice
 */
export function renderInvoiceTemplate(data: InvoiceData): string {
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
      <title>ใบแจ้งหนี้ - ${data.invoiceNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Sarabun', sans-serif; /* รองรับภาษาไทยได้สมบูรณ์ */
          color: #333;
          margin: 0;
          padding: 20px 30px;
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
        .header .company-name {
          font-size: 20px;
          font-weight: bold;
          color: #555;
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
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">CRM Bank Co., Ltd.</div>
        <div>
          <h1>ใบแจ้งหนี้ (INVOICE)</h1>
        </div>
      </div>
      
      <div class="customer-info-container">
        <div class="customer-details">
          <h3>ข้อมูลลูกค้า (Customer)</h3>
          <p><strong>ชื่อบริษัท:</strong> ${data.customerName}</p>
          <p><strong>ผู้ติดต่อ:</strong> ${data.contactName}</p>
          <p><strong>ที่อยู่:</strong> ${data.customerAddress}</p>
        </div>
        <div class="invoice-details">
          <h3>รายละเอียดใบแจ้งหนี้ (Invoice Info)</h3>
          <p><strong>เลขที่ใบแจ้งหนี้:</strong> ${data.invoiceNumber}</p>
          <p><strong>วันที่ออกเอกสาร:</strong> ${data.date}</p>
          <p><strong>เงื่อนไขการชำระเงิน:</strong> 30 วัน</p>
        </div>
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
        <p style="margin-top: 40px;">ขอบคุณที่ใช้บริการ / Thank you for your business</p>
      </div>
    </body>
    </html>
  `;
}
