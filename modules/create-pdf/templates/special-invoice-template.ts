import fs from "fs";
import path from "path";

export interface SpecialInvoiceData {
  invoiceNumber: string;
  saleOrderRef?: string;
  status?: string;
  date: string;
  customerName: string;
  customerCode?: string;
  customerPhone: string;
  customerAddress: string;
  billingAddress: string;

  otherCostsDescription?: string;
  deliveryMethod: string;
  deliveryMethodRaw?: string;
  shippingAddress: string;
  receivingAddress: string;
  shippingCompanyName: string;
  senderAddress: string;

  paymentTerm: string;
  deliveryDate: string;
  requestedDeliveryDate?: string;
  shippingCustomerAddressId?: string;
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
    promotionBudget?: number;
  }[];
  contactName: string;
  subtotalAmount: number;
  shippingDiscount: number;
  billDiscount: number;
  totalAmount: number;
  promotionalBudgetTotal: number;
  budgetDetails?: {
    type: string;
    amount: number;
    description?: string;
  }[];
  title: string;
  notes?: string;
  approverNotes?: string;
  managerNotes?: string;
  signatureDate?: string;
  signatureImage?: string;
  preparedBySignatureDate?: string;
  preparedBySignatureImage?: string;
  checkedBySignatureDate?: string;
  checkedBySignatureImage?: string;
  approvedBySignatureDate?: string;
  approvedBySignatureImage?: string;
  approvedByName?: string;
}

function safeValue(value?: string | number | null) {
  if (value === null || value === undefined) return "-";
  const text = String(value).trim();
  return text ? text : "-";
}

function getImageBase64(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("data:image/")) return url;

  try {
    const relativePath = url.replace(/^\//, "");
    const fullPath = path.join(process.cwd(), "public", relativePath);
    if (fs.existsSync(fullPath)) {
      const bitmap = fs.readFileSync(fullPath);
      const ext = path.extname(fullPath).replace(".", "") || "png";
      return `data:image/${ext};base64,${bitmap.toString("base64")}`;
    }
  } catch (err) {
    console.error("Error reading image for PDF:", url, err);
  }
  return "";
}

function formatNumber(value?: number | null) {
  return Number(value || 0).toLocaleString("th-TH");
}

function renderDeliveryRows(data: SpecialInvoiceData): string {
  const hasPaymentDate = data.paymentDate && data.paymentDate !== "-";

  let html = ``;

  if (data.deliveryMethodRaw === "FACTORY_DELIVERY" || data.deliveryMethodRaw === "SALES_DELIVERY") {
    html += `
      <div class="sales-row two-cols">
        <div class="sales-cell">
          <span class="info-label">วิธีจัดส่ง:</span>
          <span>${safeValue(data.deliveryMethod)}</span>
        </div>
        <div class="sales-cell">
          <span class="info-label">ที่อยู่จัดส่งสินค้า:</span>
          <span>${safeValue(data.shippingAddress)}</span>
        </div>
      </div>
    `;
  }

  if (data.deliveryMethodRaw === "CUSTOMER_PICKUP") {
    html += `
      <div class="sales-row two-cols">
        <div class="sales-cell">
          <span class="info-label">วิธีจัดส่ง:</span>
          <span>${safeValue(data.deliveryMethod)}</span>
        </div>
        <div class="sales-cell">
          <span class="info-label">วันที่มารับสินค้า:</span>
          <span>${safeValue(data.requestedDeliveryDate)}</span>
        </div>
      </div>
      <div class="sales-row" style="grid-template-columns: 1fr;">
        <div class="sales-cell">
          <span class="info-label">สถานที่รับสินค้า:</span>
          <span>${safeValue(data.receivingAddress)}</span>
        </div>
      </div>
    `;
  }

  if (data.deliveryMethodRaw === "COURIER") {
    html += `
      <div class="sales-row two-cols">
        <div class="sales-cell">
          <span class="info-label">วิธีจัดส่ง:</span>
          <span>${safeValue(data.deliveryMethod)}</span>
        </div>
        <div class="sales-cell">
          <span class="info-label">ชื่อบริษัทขนส่ง:</span>
          <span>${safeValue(data.shippingCompanyName)}</span>
        </div>
      </div>
      <div class="sales-row" style="grid-template-columns: 1fr;">
        <div class="sales-cell">
          <span class="info-label">ที่อยู่บริษัทขนส่ง:</span>
          <span>${safeValue(data.senderAddress)}</span>
        </div>
      </div>
      <div class="sales-row" style="grid-template-columns: 1fr;">
        <div class="sales-cell">
          <span class="info-label">ที่อยู่จัดส่งสินค้า:</span>
          <span>${safeValue(data.shippingAddress)}</span>
        </div>
      </div>
    `;
  }

  html += `
    <div class="sales-row row-delivery-info">
        <div class="sales-cell">
          <span class="info-label">วันที่จัดส่ง:</span>
          <span>${safeValue(data.deliveryDate)}</span>
        </div>
        <div class="sales-cell">
          <span class="info-label">ครบกำหนดชำระ:</span>
          <span>${safeValue(data.creditDueDate)}</span>
        </div>
        <div class="sales-cell">
          <span class="info-label">ผู้ขาย:</span>
          <span>${safeValue(data.contactName)}</span>
        </div>
     </div>
  `;

  if (hasPaymentDate) {
    html += `
      <div class="sales-row row-payment-info">
        <div class="sales-cell">
          <span class="info-label">วันที่ชำระเงิน:</span>
          <span>${safeValue(data.paymentDate)}</span>
        </div>
      </div>
    `;
  }

  return html;
}

export function renderSpecialInvoiceTemplate(data: SpecialInvoiceData): string {
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
    data.saleOrderRef != null
      ? safeValue(data.saleOrderRef || data.invoiceNumber)
      : safeValue(data.invoiceNumber);

  const title =
    data.saleOrderRef != null
      ? "เลขที่คำสั่งขาย"
      : "เลขที่ออเดอร์";
  const itemsHtml = data.items
    .map(
      (item, index) => `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td class="text-left">
            <div>${safeValue(item.description)}</div>
            ${item.promotionBudget && item.promotionBudget > 0
          ? `<div style="font-size: 8px; color: #059669;">งบส่งเสริมการขาย: ฿${formatNumber(item.promotionBudget)} / ลัง (รวม ฿${formatNumber(item.promotionBudget * item.quantity)})</div>`
          : ""
        }
          </td>
          <td class="text-center">${formatNumber(item.quantity)}</td>
          <td class="text-center">${safeValue(item.unit)}</td>
          <td class="text-center">${formatNumber(item.packageSizePerBox)}</td>
          <td class="text-center">${formatNumber(item.price)}</td>
          <td class="text-center">${formatNumber(item.cartonPrice)}</td>
          <td class="text-center total-cell">${formatNumber(item.total)}</td>
        </tr>
      `,
    )
    .join("");

  const preparedSign = getImageBase64(data.preparedBySignatureImage || data.signatureImage);
  const approvedSign = getImageBase64(data.approvedBySignatureImage);

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
    .special-watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 100px;
      color: rgba(200, 200, 200, 0.2);
      z-index: -1;
      white-space: nowrap;
      pointer-events: none;
    }
    .signature-section {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 15px !important;
    }
    .signature-card {
      padding: 0 10px !important;
    }
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
          <p>เลขที่ 22 อาคารไอซีจี ถนนพระรามที่ 6 แขวงพญาไท เขตพญาไท กรุงเทพฯ 10400</p>
          <div class="company-contact">โทร. 02-618-4522 &nbsp;&nbsp; แฟกซ์ 02-618-4530 &nbsp;&nbsp;www.cropsciences.co.th </div>
        </div>
      </div>

      <div class="doc-meta">
        <p class="doc-title-th">${safeValue(data.title)} (พิเศษ)</p>
        <p class="doc-title-en">SPECIAL SALES NOTE</p>
        <div class="doc-no-box">
          <span class="label">${title}:</span>
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
          <div class="info-col" style="flex: 2;">
            <span class="info-label">ชื่อบริษัท</span>
            <span>${safeValue(data.customerName)}</span>
          </div>
          <div class="info-col no-border" style="flex: 2; display: flex; gap: 24px;">
            <div>
              <span class="info-label">รหัสลูกค้า:</span>
              <span>${safeValue(data.customerCode)}</span>
            </div>
            <div>
              <span class="info-label">เบอร์โทรศัพท์:</span>
              <span>${safeValue(data.customerPhone)}</span>
            </div>
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
      </div>
    </div>

    <!-- ข้อมูลการขาย -->
    <div class="section">
      <div class="section-title">ข้อมูลการขาย</div>
      <div class="sales-grid">
        <div class="sales-row row-order-info">
          <div class="sales-cell">
            <span class="info-label">วันที่ออเดอร์:</span>
            <span>${safeValue(data.date)}</span>
          </div>
          ${data.saleOrderRef != null ? `
          <div class="sales-cell">
            <span class="info-label">เลขที่ออเดอร์:</span>
            <span>${safeValue(data.invoiceNumber)}</span>
          </div>
          ` : ""}
          <div class="sales-cell" ${data.saleOrderRef == null ? 'style="grid-column: span 2;"' : ""}>
            <span class="info-label">เงื่อนไขการชำระเงิน:</span>
            <span>${safeValue(data.paymentTerm)}</span>
          </div>
        </div>
        ${renderDeliveryRows(data)}
      </div>
    </div>

    <!-- ตารางสินค้า -->
    <div class="product-table-wrap">
      <table class="product-table">
        <thead>
          <tr>
            <th style="width: 4%;">ลำดับ</th>
            <th class="text-left" style="width: 35%;">รายละเอียดสินค้า</th>
            <th style="width: 10%;">จำนวน</th>
            <th style="width: 8%;">หน่วย</th>
            <th style="width: 5%;">บรรจุ</th>
            <th style="width: 12%;">ราคา/หน่วย</th>
            <th style="width: 11%;">ราคา/ลัง</th>
            <th style="width: 15%;">ราคารวม</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- สรุปยอด -->
    <div class="summary-wrap">
      <div class="promotional-budget-summary">
        ${data.promotionalBudgetTotal > 0 ? `งบส่งเสริมการขายรวม: ${formatNumber(data.promotionalBudgetTotal)} THB` : ""}
      </div>
      <div class="summary-box">
        <div class="summary-row">
          <span>รวมเป็นเงิน</span>
          <span>${formatNumber(data.subtotalAmount)} THB</span>
        </div>

        ${data.shippingDiscount > 0
      ? `
          <div class="summary-row">
            <span>ส่วนลดค่าขนส่ง</span>
            <span style="color: red;">-${formatNumber(data.shippingDiscount)} THB</span>
          </div>
        `
      : ""
    }

        ${data.billDiscount > 0
      ? `
          <div class="summary-row">
            <span>ส่วนลดหน้าบิล</span>
            <span style="color: red;">-${formatNumber(data.billDiscount)} THB</span>
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

    ${data.notes || data.approverNotes || data.managerNotes
      ? `
    <div class="notes-section" style="display: flex; flex-direction: column; gap: 8px;">
      ${data.notes ? `
      <div>
        <span class="notes-label">หมายเหตุ (คนสร้าง):</span>
        <span>${data.notes}</span>
      </div>` : ''}
      ${data.approverNotes ? `
      <div>
        <span class="notes-label">หมายเหตุ (คนอนุมัติ):</span>
        <span>${data.approverNotes}</span>
      </div>` : ''}
      ${data.managerNotes ? `
      <div>
        <span class="notes-label">หมายเหตุ:</span>
        <span>${data.managerNotes}</span>
      </div>` : ''}
    </div>
    `
      : ""
    }

    ${data.budgetDetails && data.budgetDetails.length > 0
      ? `
    <div class="notes-section">
      <span class="notes-label">งบส่งเสริมการขาย:</span>
      <div style="margin-left: 20px;">
        ${data.budgetDetails.map(budget => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>${budget.type === 'SALES_PROMOTION' ? 'งบส่งเสริมการขาย (ระบุช่องเก็บ)' : 'งบส่งเสริมการตลาด (ระบุช่องเก็บ)'} 
              ${budget.description ? ` - ${budget.description}` : ''}
            </span>
            <span style="font-weight: 600;">฿${formatNumber(budget.amount)}</span>
          </div>
        `).join('')}
      </div>
    </div>
    `
      : ""
    }
    
    ${data.otherCostsDescription
      ? `
    <div class="notes-section">
      <span class="notes-label">รายละเอียดส่วนลดหน้าบิล:</span>
      <span>${data.otherCostsDescription}</span>
    </div>
    `
      : ""
    }

    <!-- ลายเซ็น -->
    <div class="signature-section">
      <div class="signature-card">
        <div class="signature-title">พนักงานขาย</div>
        <div class="sign-row" style="position: relative; height: 40px; margin-top: 10px;">
          <div class="dot-line" style="position: relative;">
            ${preparedSign ? `<img src="${preparedSign}" style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); max-height: 60px; max-width: 150px;" />` : ""}
          </div>
        </div>
          <div class="sign-row" style="position: relative; margin-top: 25px;">
            <span style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); white-space: nowrap;">
            ( ${safeValue(data.contactName)} )
            </span>
          </div>
        <div class="sign-row" style="position: relative; margin-top: -5px;">
          <span>วันที่</span>
          <div class="dot-line" style="position: relative;">
            ${data.preparedBySignatureDate ? `<span style="position: absolute; bottom: 2px; left: 45%; transform: translateX(-50%); white-space: nowrap;">${data.preparedBySignatureDate}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="signature-card">
        <div class="signature-title">ผจก.แผนกบริหารงานขาย</div>
        <div class="sign-row" style="position: relative; height: 40px; margin-top: 10px;">
          <div class="dot-line" style="position: relative;">
            ${approvedSign ? `<img src="${approvedSign}" style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); max-height: 60px; max-width: 150px;" />` : ""}
          </div>
        </div>
        <div class="sign-row" style="position: relative; margin-top: 25px;">
          <span style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); white-space: nowrap;">
            ${data.approvedByName && data.approvedByName !== "-" ? `( ${data.approvedByName} )` : ""}
          </span>
        </div>
        <div class="sign-row" style="position: relative; margin-top: -5px;">
          <span>วันที่</span>
          <div class="dot-line" style="position: relative;">
            ${data.approvedBySignatureDate && data.approvedBySignatureDate !== "-" ? `<span style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); white-space: nowrap;">${data.approvedBySignatureDate}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="signature-card">
        <div class="signature-title">ผู้จัดการฝ่ายขาย</div>
        <div class="sign-row" style="position: relative; height: 40px; margin-top: 10px;">
          <div class="dot-line" style="position: relative;"></div>
        </div>
        <div class="sign-row" style="position: relative; margin-top: 25px;">
          <span style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); white-space: nowrap;">
            ( คุณนวีณ  มงคลธรรมากุล )
          </span>
        </div>
        <div class="sign-row" style="position: relative; margin-top: -5px;">
          <span>วันที่</span>
          <div class="dot-line" style="position: relative;"></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
