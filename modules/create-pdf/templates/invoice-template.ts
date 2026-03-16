import fs from "fs";
import path from "path";

export interface InvoiceData {
  invoiceNumber: string;
  saleOrderRef?: string;
  status?: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
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
    packageSizePerBox: number;
    description: string;
    quantity: number;
    unit: string;
    price: number;
    cartonPrice: number;
    total: number;
  }[];
  contactName: string;
  subtotalAmount: number;
  shippingDiscount: number;
  billDiscount: number;
  totalAmount: number;
  title: string;
}

function safeValue(value?: string | number | null) {
  if (value === null || value === undefined) return "-";
  const text = String(value).trim();
  return text ? text : "-";
}

function formatNumber(value?: number | null) {
  return Number(value || 0).toLocaleString("th-TH");
}

export function renderInvoiceTemplate(data: InvoiceData): string {
  const logoPath = path.join(process.cwd(), "public", "images", "logo_pdf.png");
  let base64Logo = "";
  if (fs.existsSync(logoPath)) {
    const bitmap = fs.readFileSync(logoPath);
    base64Logo = "data:image/png;base64," + bitmap.toString("base64");
  }

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

  const documentNumber =
    data.status === "COMPLETED"
      ? safeValue(data.saleOrderRef || data.invoiceNumber)
      : safeValue(data.invoiceNumber);

  const itemsHtml = data.items
    .map(
      (item) => `
        <tr>
          <td class="text-left">${safeValue(item.code)}</td>
          <td class="text-left">${safeValue(item.description)}</td>
          <td class="text-center">${formatNumber(item.quantity)}</td>
          <td class="text-center">${safeValue(item.unit)}</td>
          <td class="text-center">${formatNumber(item.packageSizePerBox)}</td>
          <td class="text-right">${formatNumber(item.price)}</td>
          <td class="text-right">${formatNumber(item.cartonPrice)}</td>
          <td class="text-right total-cell">${formatNumber(item.total)}</td>
        </tr>
      `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeValue(data.title)} - ${safeValue(data.invoiceNumber)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    ${cssContent}
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="company-block">
        ${base64Logo ? `<img src="${base64Logo}" alt="logo" class="company-logo" />` : ""}
        <div class="company-text">
          <h1>บริษัท คร็อพ ซายน์ จำกัด</h1>
          <h2>CROP SCIENCES CO., LTD.</h2>
          <p>เลขที่ 22 อาคารไอซี ถนนพระรามที่ 6 แขวงพญาไท</p>
          <p>เขตพญาไท กรุงเทพฯ 10400</p>
          <div class="company-contact">โทร. 02-271-4343 &nbsp;&nbsp; แฟกซ์ 02-618-4530</div>
        </div>
      </div>

      <div class="doc-meta">
        <p class="doc-title-th">${safeValue(data.title)}</p>
        <p class="doc-title-en">SALES NOTE</p>
        <div class="doc-no-box">
          <span class="label">เลขที่คำสั่งขาย</span>
          <span class="value">${documentNumber ?? "-"}</span>
        </div>
      </div>
    </div>

    <div class="top-divider"></div>

    <!-- ข้อมูลลูกค้า -->
    <div class="section">
      <div class="section-title">ข้อมูลลูกค้า</div>
      <div class="section-box">
        <div class="info-row">
          <div class="info-col">
            <span class="info-label">ชื่อบริษัท</span>
            <span>${safeValue(data.customerName)}</span>
          </div>
          <div class="info-col no-border">
            <span class="info-label">เบอร์โทรศัพท์:</span>
            <span>${safeValue(data.customerPhone)}</span>
          </div>
        </div>

        <div class="info-row">
          <div class="info-col full">
            <span class="info-label">ที่อยู่บริษัท</span>
            <span>${safeValue(data.customerAddress)}</span>
          </div>
        </div>

        <div class="info-row">
          <div class="info-col full">
            <span class="info-label">ที่อยู่วางบิล</span>
            <span>${safeValue(data.billingAddress)}</span>
          </div>
        </div>

        <div class="info-row">
          <div class="info-col full">
            <span class="info-label">ที่อยู่จัดส่ง</span>
            <span>${safeValue(data.shippingAddress)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ข้อมูลการขาย -->
    <div class="section">
      <div class="section-title">ข้อมูลการขาย</div>
      <div class="sales-grid">
        <div class="sales-row">
          <div class="sales-cell">
            <span class="info-label">วันที่ออเดอร์:</span>
            <span>${safeValue(data.date)}</span>
          </div>
          <div class="sales-cell">
            <span class="info-label">เลขที่ออเดอร์:</span>
            <span>${safeValue(data.invoiceNumber)}</span>
          </div>
          <div class="sales-cell no-border">
            <span class="info-label">เงื่อนไขการชำระเงิน:</span>
            <span>${safeValue(data.paymentTerm)}</span>
          </div>
        </div>

        <div class="sales-row">
          <div class="sales-cell">
            <span class="info-label">วันที่จัดส่ง:</span>
            <span>${safeValue(data.deliveryDate)}</span>
          </div>
          <div class="sales-cell">
            <span class="info-label">ครบกำหนดชำระ:</span>
            <span>${safeValue(data.creditDueDate)}</span>
          </div>
          <div class="sales-cell no-border">
            <span class="info-label">ผู้ขาย:</span>
            <span>${safeValue(data.contactName)}</span>
          </div>
        </div>

        ${data.paymentDate && data.paymentDate !== "-"
      ? `
        <div class="sales-row">
          <div class="sales-cell">
            <span class="info-label">วันที่ชำระเงิน:</span>
            <span>${safeValue(data.paymentDate)}</span>
          </div>
          <div class="sales-cell">
            <span class="info-label">วิธีจัดส่ง:</span>
            <span>${safeValue(data.deliveryMethod)}</span>
          </div>
          <div class="sales-cell">
            <span class="info-label">บริษัทขนส่ง:</span>
            <span>${safeValue(data.shippingCompanyName)}</span>
          </div>
        </div>
        `
      : `
        <div class="sales-row">
          <div class="sales-cell">
            <span class="info-label">วิธีจัดส่ง:</span>
            <span>${safeValue(data.deliveryMethod)}</span>
          </div>
          <div class="sales-cell">
            <span class="info-label">บริษัทขนส่ง:</span>
            <span>${safeValue(data.shippingCompanyName)}</span>
          </div>
          <div class="sales-cell no-border">
            <span class="info-label">ที่อยู่รับสินค้า:</span>
            <span>${safeValue(data.receivingAddress)}</span>
          </div>
        </div>
        `
    }
      </div>
    </div>

    <!-- ตารางสินค้า -->
    <div class="product-table-wrap">
      <table class="product-table">
        <thead>
          <tr>
            <th style="width: 14%;">รหัสสินค้า</th>
            <th style="width: 28%;">รายละเอียดสินค้า</th>
            <th style="width: 8%;">จำนวน</th>
            <th style="width: 8%;">หน่วย</th>
            <th style="width: 8%;">บรรจุ</th>
            <th style="width: 12%;">ราคา/หน่วย</th>
            <th style="width: 10%;">ราคา/ลัง</th>
            <th style="width: 12%;">ราคารวม</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- สรุปยอด -->
    <div class="summary-wrap">
      <div class="summary-box">
        <div class="summary-row">
          <span>รวมเป็นเงิน</span>
          <span>${formatNumber(data.subtotalAmount)} THB</span>
        </div>

        ${data.shippingDiscount > 0
      ? `
          <div class="summary-row">
            <span>ส่วนลดค่าขนส่ง</span>
            <span>-${formatNumber(data.shippingDiscount)} THB</span>
          </div>
        `
      : ""
    }

        ${data.billDiscount > 0
      ? `
          <div class="summary-row">
            <span>ส่วนลดหน้าบิล</span>
            <span>-${formatNumber(data.billDiscount)} THB</span>
          </div>
        `
      : ""
    }

        <div class="summary-row grand-total">
          <span>ยอดรวมทั้งสิ้น</span>
          <span>${formatNumber(data.totalAmount)} THB</span>
        </div>
      </div>
    </div>

    <!-- ลายเซ็น -->
    <div class="signature-section">
      <div class="signature-card">
        <div class="signature-title">ผู้จัดทำ</div>
        <div class="sign-row">
          <span>ลงรับ</span>
          <div class="dot-line"></div>
        </div>
        <div class="sign-row">
          <span>วันที่</span>
          <div class="dot-line"></div>
        </div>
      </div>

      <div class="signature-card">
        <div class="signature-title">ผู้ตรวจสอบ</div>
        <div class="sign-row">
          <span>ลงรับ</span>
          <div class="dot-line"></div>
        </div>
        <div class="sign-row">
          <span>วันที่</span>
          <div class="dot-line"></div>
        </div>
      </div>

      <div class="signature-card">
        <div class="signature-title">ผู้อนุมัติ</div>
        <div class="sign-row">
          <span>ลงรับ</span>
          <div class="dot-line"></div>
        </div>
        <div class="sign-row">
          <span>วันที่</span>
          <div class="dot-line"></div>
        </div>
      </div>
    </div>

    <div class="bottom-bar"></div>
  </div>
</body>
</html>
  `;
}
