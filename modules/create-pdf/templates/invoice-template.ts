import fs from "fs";
import path from "path";

export interface InvoiceData {
  invoiceNumber: string;
  saleOrderRef?: string;
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
    packageSizePerBox: number;
    description: string;
    quantity: number;
    price: number;
    cartonPrice: number;
    total: number;
  }[];
  contactName: string;
  subtotalAmount: number;
  shippingDiscount: number;
  billDiscount: number;
  totalAmount: number; // This is the amount after discounts, before VAT
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
      <td class="col-left">${item.code}</td>
      <td class="col-left">${item.description}</td>
      <td class="col-center">${item.quantity}</td>
      <td class="col-center">${item.packageSizePerBox}</td>
      <td class="col-center">${item.price.toLocaleString()}</td>
      <td class="col-center">${item.cartonPrice.toLocaleString()}</td>
      <td class="col-center fw-bold">${item.total.toLocaleString()}</td>
    </tr>
  `,
    )
    .join("");

  // Build customer name + address row
  const customerNameAndAddressRow = (() => {
    const name = (data.customerName ?? "").trim();
    const address = (data.customerAddress ?? "").trim();
    if (!name || name === "-") return "";

    const addressSpan =
      address && address !== "-"
        ? `<span class="phone"><strong>ที่อยู่บริษัท:</strong> ${address}</span>`
        : "";

    return `<p><strong>ชื่อบริษัท:</strong> ${name} ${addressSpan}</p>`;
  })();

  // Build row with Phone and Billing Address on the same line
  const phoneAndBillingRow = (() => {
    const phone = (data.customerPhone ?? "").trim();
    const billing = (data.billingAddress ?? "").trim();
    const hasPhone = phone && phone !== "-";
    const hasBilling = billing && billing !== "-";

    if (!hasPhone && !hasBilling) return "";

    const billingPart = hasBilling
      ? `<strong>ที่อยู่วางบิล:</strong> ${billing}`
      : "";
    const phonePart = hasPhone
      ? `<span class="${hasBilling ? "phone" : ""}"><strong>เบอร์โทรศัพท์:</strong> ${phone}</span>`
      : "";

    return `<p>${billingPart} ${phonePart}</p>`;
  })();

  // Build shipping method + company name row
  const deliveryMethodAndCompanyRow = (() => {
    const method = (data.deliveryMethod ?? "").trim();
    const company = (data.shippingCompanyName ?? "").trim();
    const hasMethod = method && method !== "-";
    const hasCompany = company && company !== "-";

    if (!hasMethod && !hasCompany) return "";

    const methodPart = hasMethod
      ? `<strong>วิธีการจัดส่ง:</strong> ${method}`
      : "";
    const companyPart = hasCompany
      ? `<span class="${hasMethod ? "phone" : ""}"><strong>ชื่อบริษัทขนส่ง:</strong> ${company}</span>`
      : "";

    return `<p>${methodPart} ${companyPart}</p>`;
  })();

  // Build shipping company address row
  const shippingCompanyAddressRow = (() => {
    const address = (data.senderAddress ?? "").trim();
    if (!address || address === "-") return "";
    return `<p><strong>ที่อยู่บริษัทขนส่ง:</strong> ${address}</p>`;
  })();

  // Build reference: Date + Order Number + Payment Term row
  const refHeaderRow = (() => {
    const date = (data.date ?? "").trim();
    const no = (data.invoiceNumber ?? "").trim();
    const term = (data.paymentTerm ?? "").trim();

    const hasDate = date && date !== "-";
    const hasNo = no && no !== "-";
    const hasTerm = term && term !== "-";

    if (!hasDate && !hasNo && !hasTerm) return "";

    const datePart = hasDate ? `<strong>วันที่:</strong> ${date}` : "";
    const noPart = hasNo
      ? `<span class="${hasDate ? "phone" : ""}"><strong>เลขที่ออเดอร์:</strong> ${no}</span>`
      : "";
    const termPart = hasTerm
      ? `<span class="${hasDate || hasNo ? "phone" : ""}"><strong>เงื่อนไขการชำระเงิน:</strong> ${term}</span>`
      : "";

    return `<p>${datePart} ${noPart} ${termPart}</p>`;
  })();

  // Build reference: Delivery Date + Seller + Credit Due Date row
  const refDatesRow = (() => {
    const dDate = (data.deliveryDate ?? "").trim();
    const seller = (data.contactName ?? "").trim();
    const credit = (data.creditDueDate ?? "").trim();

    const hasDDate = dDate && dDate !== "-";
    const hasSeller = seller && seller !== "-";
    const hasCredit = credit && credit !== "-";

    if (!hasDDate && !hasSeller && !hasCredit) return "";

    const dDatePart = hasDDate ? `<strong>วันที่จัดส่ง:</strong> ${dDate}` : "";
    const sellerPart = hasSeller
      ? `<span class="${hasDDate ? "phone" : ""}"><strong>ผู้ขาย:</strong> ${seller}</span>`
      : "";
    const creditPart = hasCredit
      ? `<span class="${hasDDate || hasSeller ? "phone" : ""}"><strong>วันที่ครบกำหนดชำระเงิน:</strong> ${credit}</span>`
      : "";

    return `<p>${dDatePart} ${creditPart} ${sellerPart}</p>`;
  })();

  // Build reference: Payment Date row
  const refOtherRow = (() => {
    const pDate = (data.paymentDate ?? "").trim();
    if (!pDate || pDate === "-") return "";
    return `<p><strong>วันที่ชำระเงิน:</strong> ${pDate}</p>`;
  })();

  // Build receiving + shipping address row
  const receivingAndShippingRow = (() => {
    const shipping = (data.shippingAddress ?? "").trim();
    const receiving = (data.receivingAddress ?? "").trim();
    const hasShipping = shipping && shipping !== "-";
    const hasReceiving = receiving && receiving !== "-";

    if (!hasShipping && !hasReceiving) return "";

    const shippingPart = hasShipping
      ? `<strong>ที่อยู่จัดส่งสินค้า:</strong> ${shipping}`
      : "";
    const receivingPart = hasReceiving
      ? `<span class="${hasShipping ? "phone" : ""}"><strong>ที่อยู่รับสินค้า:</strong> ${receiving}</span>`
      : "";

    return `<p>${shippingPart} ${receivingPart}</p>`;
  })();

  // Build sale order ref row for header
  const saleOrderRefRow = (() => {
    const v = (data.saleOrderRef ?? "").trim();
    if (!v || v === "-") return "";
    return `<div class="label">เลขที่คำสั่งขาย</div><div class="doc-no">${v}</div>`;
  })();

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
    ${saleOrderRefRow}
  </div>

</div>

<div class="doc-title">${data.title}</div>
<div class="doc-divider"></div>
      <div class="customer-details">
        <h3>ข้อมูลลูกค้า</h3>
        ${customerNameAndAddressRow}
        ${phoneAndBillingRow}
      </div>
      <div class="customer-info-container">
        <div class="logistics-details">
          <h3>ข้อมูลการจัดส่ง</h3>
          ${deliveryMethodAndCompanyRow}
          ${shippingCompanyAddressRow}
          ${receivingAndShippingRow}
        </div>
        <div class="invoice-details">
          <h3>ข้อมูลอ้างอิง</h3>
          ${refHeaderRow}
          ${refDatesRow}
          ${refOtherRow}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="col-left" style="width: 22%;">รหัสสินค้า</th>
            <th class="col-left" style="width: 31%;">รายละเอียดสินค้า</th>
            <th class="col-left" style="width: 5%;">จำนวน</th>
            <th class="col-left" style="width: 5%;">บรรจุ</th>
            <th class="col-left" style="width: 13%;">ราคา/หน่วย</th>
            <th class="col-left" style="width: 10%;">ราคา/ลัง</th>
            <th class="col-left" style="width: 20%;">จำนวนเงินรวม</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="footer-section">
        <div class="total-section">
          <div class="total-row">
            <span>รวมเป็นเงิน:</span>
            <span>${data.subtotalAmount.toLocaleString()} THB</span>
          </div>
          ${
            data.shippingDiscount > 0
              ? `
          <div class="total-row">
            <span>ส่วนลดค่าขนส่ง:</span>
            <span>-${data.shippingDiscount.toLocaleString()} THB</span>
          </div>`
              : ""
          }
          ${
            data.billDiscount > 0
              ? `
          <div class="total-row">
            <span>ส่วนลดหน้าบิล:</span>
            <span>-${data.billDiscount.toLocaleString()} THB</span>
          </div>`
              : ""
          }
          <div class="total-row grand-total">
            <span>ยอดรวมทั้งสิ้น:</span>
            <span>${data.totalAmount.toLocaleString()} THB</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
