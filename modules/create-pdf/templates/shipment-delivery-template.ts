import fs from "fs";
import path from "path";

export interface ShipmentDeliveryData {
  // Sale info
  saleNumber: string;
  saleOrderRef?: string | null;
  // Shipment info
  shipmentNumber: number;
  scheduledDate: string;
  actualDate: string;
  shipmentStatus: string;
  // Customer info
  customerName: string;
  customerCode?: string;
  customerPhone?: string;
  customerAddress?: string;
  // Shipping info
  shippingCompanyName: string;
  // Items
  items: {
    productCode: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  // Meta
  notes?: string | null;
  createdByName?: string;
  printedDate: string;
}

function safeValue(value?: string | number | null) {
  if (value === null || value === undefined) return "-";
  const text = String(value).trim();
  return text ? text : "-";
}

function formatCurrency(value: number): string {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

function formatNumber(value?: number | null) {
  return Number(value || 0).toLocaleString("th-TH");
}


export function renderShipmentDeliveryTemplate(data: ShipmentDeliveryData): string {
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

  const itemsHtml = data.items
    .map(
      (item, index) => `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td class="text-left">
            <div style="font-weight: 600;">${safeValue(item.productCode)}</div>
            <div style="font-size: 10px; color: #6b7280;">${safeValue(item.productName)}</div>
          </td>
          <td class="text-center">${formatNumber(item.quantity)}</td>
          <td class="text-center">${safeValue(item.unit)}</td>
          <td class="text-center">${formatNumber(item.unitPrice)}</td>
          <td class="text-center total-cell">${formatNumber(item.totalPrice)}</td>
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
  <title>ใบจัดส่งสินค้า - ${safeValue(data.saleNumber)} ครั้งที่ ${data.shipmentNumber}</title>
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
          <p>เลขที่ 22 อาคารไอซีจี ถนนพระรามที่ 6 แขวงพญาไท เขตพญาไท กรุงเทพฯ 10400</p>
          <div class="company-contact">โทร. 02-618-4522 &nbsp;&nbsp; แฟกซ์ 02-618-4530 &nbsp;&nbsp;www.cropsciences.co.th </div>
        </div>
      </div>

      <div class="doc-meta">
        <p class="doc-title-th">ใบจัดส่งสินค้า</p>
        <p class="doc-title-en">DELIVERY NOTE</p>
        <div class="doc-no-box">
          <span class="label">เลขที่ออเดอร์:</span>
          <span class="value">${safeValue(data.saleOrderRef || data.saleNumber)}</span>
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
            <span class="info-label">ชื่อลูกค้า</span>
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
            <span class="info-label">ที่อยู่จัดส่ง</span>
            <span>${safeValue(data.customerAddress)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ข้อมูลการจัดส่ง -->
    <div class="section">
      <div class="section-title">ข้อมูลการจัดส่ง</div>
      <div class="sales-grid">
        <div class="sales-row row-order-info">
          <div class="sales-cell">
            <span class="info-label">การจัดส่งครั้งที่:</span>
            <span>${data.shipmentNumber}</span>
          </div>
          <div class="sales-cell">
            <span class="info-label">บริษัทขนส่ง:</span>
            <span>${safeValue(data.shippingCompanyName)}</span>
          </div>
          <div class="sales-cell">
            <span class="info-label">สถานะ:</span>
            <span>${safeValue(data.shipmentStatus)}</span>
          </div>
        </div>
        <div class="sales-row row-delivery-info">
          <div class="sales-cell">
            <span class="info-label">วันกำหนดส่ง:</span>
            <span>${safeValue(data.scheduledDate)}</span>
          </div>
          <div class="sales-cell">
            <span class="info-label">วันส่งจริง:</span>
            <span>${safeValue(data.actualDate)}</span>
          </div>
          <div class="sales-cell">
            <span class="info-label">วันพิมพ์:</span>
            <span>${safeValue(data.printedDate)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ตารางสินค้า -->
    <div class="product-table-wrap">
      <table class="product-table">
        <thead>
          <tr>
            <th style="width: 5%;">ลำดับ</th>
            <th class="text-left" style="width: 40%;">สินค้า</th>
            <th style="width: 12%;">จำนวน</th>
            <th style="width: 10%;">หน่วย</th>
            <th style="width: 16%;">ราคา/หน่วย</th>
            <th style="width: 17%;">รวม (บาท)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- สรุปยอด -->
    <div class="summary-wrap">
      <div class="summary-box" style="margin-left: auto;">
        <div class="summary-row grand-total">
          <span>มูลค่ารวมในการจัดส่งครั้งนี้</span>
          <span>฿${formatNumber(data.totalAmount)}</span>
        </div>
      </div>
    </div>

    ${data.notes
      ? `
    <div class="notes-section">
      <span class="notes-label">หมายเหตุ:</span>
      <span>${data.notes}</span>
    </div>
    `
      : ""
    }

    <!-- ลายเซ็น -->
    <div class="signature-section">
      <div class="signature-card">
        <div class="signature-title">ผู้ส่งสินค้า</div>
        <div class="sign-row" style="position: relative; height: 40px; margin-top: 10px;">
          <div class="dot-line" style="position: relative;"></div>
        </div>
        <div class="sign-row" style="position: relative; margin-top: 25px;">
          <span style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); white-space: nowrap;">
            ( .................................................... )
          </span>
        </div>
        <div class="sign-row" style="position: relative; margin-top: -5px;">
          <span>วันที่</span>
          <div class="dot-line" style="position: relative;"></div>
        </div>
      </div>

      <div class="signature-card">
        <div class="signature-title">ผู้รับสินค้า</div>
        <div class="sign-row" style="position: relative; height: 40px; margin-top: 10px;">
          <div class="dot-line" style="position: relative;"></div>
        </div>
        <div class="sign-row" style="position: relative; margin-top: 25px;">
          <span style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); white-space: nowrap;">
            ( .................................................... )
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
