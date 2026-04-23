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
  }[];
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

export function renderShipmentDeliveryTemplate(data: ShipmentDeliveryData): string {
  const logoPath = path.join(process.cwd(), "public", "images", "logo_pdf.png");
  let base64Logo = "";
  if (fs.existsSync(logoPath)) {
    const bitmap = fs.readFileSync(logoPath);
    base64Logo = "data:image/png;base64," + bitmap.toString("base64");
  }

  const itemsHtml = data.items
    .map(
      (item, index) => `
      <tr>
        <td style="text-align: center; padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 600; font-size: 11px;">${safeValue(item.productCode)}</div>
          <div style="font-size: 10px; color: #6b7280;">${safeValue(item.productName)}</div>
        </td>
        <td style="text-align: center; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${item.quantity}</td>
        <td style="text-align: center; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${safeValue(item.unit)}</td>
      </tr>
    `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>ใบจัดส่งสินค้า - ${safeValue(data.saleNumber)} ครั้งที่ ${data.shipmentNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Sarabun', sans-serif; font-size: 12px; color: #1f2937; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .company-block { display: flex; align-items: center; gap: 12px; }
    .company-logo { width: 60px; height: 60px; object-fit: contain; }
    .company-name { font-size: 14px; font-weight: 700; color: #111827; }
    .company-sub { font-size: 10px; color: #6b7280; }
    .doc-meta { text-align: right; }
    .doc-title { font-size: 18px; font-weight: 800; color: #7c3aed; margin-bottom: 4px; }
    .doc-subtitle { font-size: 11px; color: #6b7280; }
    .doc-no-box { margin-top: 8px; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 6px; padding: 6px 12px; display: inline-block; }
    .doc-no-label { font-size: 10px; color: #7c3aed; }
    .doc-no-value { font-size: 14px; font-weight: 700; color: #5b21b6; }
    .divider { height: 2px; background: linear-gradient(to right, #7c3aed, #c4b5fd); margin: 16px 0; border-radius: 1px; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 11px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e9d5ff; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 12px; }
    .info-grid.full { grid-template-columns: 1fr; }
    .info-item { display: flex; flex-direction: column; gap: 2px; }
    .info-label { font-size: 9px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { font-size: 11px; color: #1f2937; font-weight: 500; }
    .shipment-badge { display: inline-flex; align-items: center; gap: 6px; background: #ede9fe; color: #5b21b6; border: 1px solid #c4b5fd; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
    .shipment-badge .dot { width: 8px; height: 8px; border-radius: 50%; background: #7c3aed; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #7c3aed; color: white; }
    thead th { padding: 8px 8px; font-size: 10px; font-weight: 600; letter-spacing: 0.03em; }
    .footer-section { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .signature-box { border: 1px solid #e9d5ff; border-radius: 8px; padding: 12px; text-align: center; }
    .signature-line { border-top: 1px dashed #c4b5fd; margin: 32px 8px 8px; }
    .signature-label { font-size: 9px; color: #7c3aed; text-transform: uppercase; font-weight: 600; }
    .notes-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 10px 14px; margin-top: 12px; }
    .notes-label { font-size: 9px; font-weight: 700; color: #a16207; text-transform: uppercase; margin-bottom: 4px; }
    .notes-text { font-size: 11px; color: #78350f; }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="company-block">
        ${base64Logo ? `<img src="${base64Logo}" alt="logo" class="company-logo" />` : ""}
        <div>
          <div class="company-name">บริษัท คร็อพ ซายน์ จำกัด</div>
          <div class="company-sub">CROP SCIENCES CO., LTD.</div>
          <div class="company-sub">โทร. 02-618-4522</div>
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-title">ใบจัดส่งสินค้า</div>
        <div class="doc-subtitle">DELIVERY NOTE</div>
        <div class="doc-no-box">
          <div class="doc-no-label">เลขที่ออเดอร์</div>
          <div class="doc-no-value">${safeValue(data.saleOrderRef || data.saleNumber)}</div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Shipment badge -->
    <div class="shipment-badge">
      <span class="dot"></span>
      การจัดส่งครั้งที่ ${data.shipmentNumber} &nbsp;|&nbsp; วันพิมพ์: ${safeValue(data.printedDate)}
    </div>

    <!-- Info grid -->
    <div class="section">
      <div class="section-title">ข้อมูลการจัดส่ง</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">ลูกค้า</span>
          <span class="info-value">${safeValue(data.customerName)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">รหัสลูกค้า</span>
          <span class="info-value">${safeValue(data.customerCode)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">บริษัทขนส่ง</span>
          <span class="info-value">${safeValue(data.shippingCompanyName)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">เบอร์โทร</span>
          <span class="info-value">${safeValue(data.customerPhone)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">วันกำหนดส่ง</span>
          <span class="info-value">${safeValue(data.scheduledDate)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">วันส่งจริง</span>
          <span class="info-value">${safeValue(data.actualDate)}</span>
        </div>
      </div>
      ${data.customerAddress ? `
      <div class="info-grid full" style="margin-top: 8px;">
        <div class="info-item">
          <span class="info-label">ที่อยู่จัดส่ง</span>
          <span class="info-value">${safeValue(data.customerAddress)}</span>
        </div>
      </div>` : ""}
    </div>

    <!-- Items table -->
    <div class="section">
      <div class="section-title">รายการสินค้าในการจัดส่งครั้งนี้</div>
      <table>
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">ลำดับ</th>
            <th style="width: 60%; text-align: left; padding-left: 8px;">สินค้า</th>
            <th style="width: 20%; text-align: center;">จำนวน</th>
            <th style="width: 15%; text-align: center;">หน่วย</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    ${data.notes ? `
    <div class="notes-box">
      <div class="notes-label">หมายเหตุ</div>
      <div class="notes-text">${safeValue(data.notes)}</div>
    </div>` : ""}

    <!-- Signatures -->
    <div class="footer-section" style="margin-top: 32px;">
      <div class="signature-box">
        <div class="signature-label">ผู้ส่งสินค้า</div>
        <div class="signature-line"></div>
        <div style="font-size: 10px; color: #6b7280;">( ................................... )</div>
        <div style="font-size: 9px; color: #9ca3af; margin-top: 4px;">วันที่: .................................</div>
      </div>
      <div class="signature-box">
        <div class="signature-label">ผู้รับสินค้า</div>
        <div class="signature-line"></div>
        <div style="font-size: 10px; color: #6b7280;">( ................................... )</div>
        <div style="font-size: 9px; color: #9ca3af; margin-top: 4px;">วันที่: .................................</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
