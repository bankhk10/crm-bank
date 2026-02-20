"use client";

import React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Image from "next/image";
import type { SaleWithRelations } from "@/types/sales";
import { PaymentTermLabels } from "@/types/sales";

interface SalesRecordDocumentProps {
  sale: SaleWithRelations;
  displayShippingAddress: string;
}

const SalesRecordDocument = React.forwardRef<
  HTMLDivElement,
  SalesRecordDocumentProps
>(({ sale, displayShippingAddress }, ref) => {
  const paymentTermLabel =
    PaymentTermLabels[sale.paymentTerm] || sale.paymentTerm;

  // Build billing address
  const billingAddress =
    sale.billingAddress ||
    [
      sale.customer.billingAddressLine || sale.customer.addressLine,
      sale.customer.billingSubdistrict || sale.customer.subdistrict
        ? `ต.${sale.customer.billingSubdistrict || sale.customer.subdistrict}`
        : "",
      sale.customer.billingDistrict || sale.customer.district
        ? `อ.${sale.customer.billingDistrict || sale.customer.district}`
        : "",
      sale.customer.billingProvince || sale.customer.province
        ? `จ.${sale.customer.billingProvince || sale.customer.province}`
        : "",
      sale.customer.billingPostalCode || sale.customer.postalCode,
    ]
      .filter(Boolean)
      .join(" ");

  const getDeliveryMethodLabel = (method?: string | null) => {
    switch (method) {
      case "SALES_DELIVERY":
        return "พนักงานขายจัดส่งสินค้า";
      case "CUSTOMER_PICKUP":
        return "ลูกค้ามารับสินค้าเอง";
      case "COURIER":
        return "ส่งโดยบริษัทขนส่ง";
      case "FACTORY_DELIVERY":
        return "ส่งโดยรถโรงงาน";
      default:
        return method || "-";
    }
  };

  const deliveryMethod = (sale as any).deliveryMethod;
  const deliveryMethodLabel = getDeliveryMethodLabel(deliveryMethod);
  const shippingCompanyName =
    sale.shippingCompany?.name ||
    sale.pickupCompany?.name ||
    "-";

  return (
    <div ref={ref} className="sales-record-document">
      <style jsx>{`
        .sales-record-document {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 12mm 15mm;
          background: #fff;
          color: #1a1a2e;
          font-family: "Sarabun", "Noto Sans Thai", sans-serif;
          font-size: 11px;
          line-height: 1.5;
          box-sizing: border-box;
        }

        /* Header */
        .doc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 3px solid #1e3a5f;
        }
        .doc-header-left {
          flex: 2;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .company-main-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .company-logo {
          position: relative;
          width: 100px;
          height: 100px;
        }
        .company-name {
          font-size: 18px;
          font-weight: 700;
          color: #1e3a5f;
          margin: 0;
          line-height: 1.2;
        }
        .company-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e3a5f;
          margin: 0;
          margin-top: 2px;
          margin-bottom: 4px;
          line-height: 1.2;
        }
        .company-subtitle {
          font-size: 11px;
          color: #64748b;
          margin: 0;
          white-space: nowrap;
        }
        .billing-address-text {
          font-size: 11px;
          color: #64748b;
          margin: 0;
          margin-top: 4px;
        }
        .doc-title {
          font-size: 24px;
          font-weight: 800;
          color: #1e3a5f;
          margin: 8px 0 0 0;
          letter-spacing: 1px;
          text-align: right;
          margin-bottom: 8px;
        }
        .doc-header-right {
          flex: 1;
          text-align: right;
        }
        .sale-number-label {
          font-size: 10px;
          color: #64748b;
          margin: 0;
        }
        .sale-number {
          font-size: 16px;
          font-weight: 700;
          color: #1e3a5f;
          margin: 2px 0 0 0;
        }
        .sale-date {
          font-size: 11px;
          color: #475569;
          margin: 4px 0 0 0;
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border: 1px solid #cbd5e1;
          margin-bottom: 16px;
        }
        .info-section {
          border-right: 1px solid #cbd5e1;
          display: flex;
          flex-direction: column;
        }
        .info-section:last-child {
          border-right: none;
        }
        .info-section-header {
          background: #f1f5f9;
          padding: 6px 10px;
          font-weight: 700;
          font-size: 10px;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #cbd5e1;
        }
        .info-section-body {
          padding: 8px 10px;
          flex: 1;
          font-size: 11px;
          color: #334155;
        }
        .info-section-body .name {
          font-weight: 700;
          color: #1e293b;
          font-size: 12px;
          margin-bottom: 3px;
        }
        .info-section-body .address-text {
          line-height: 1.6;
          margin-bottom: 3px;
        }
        .info-section-body .info-detail {
          color: #64748b;
          font-size: 10px;
        }

        /* Reference section rows */
        .ref-rows {
          display: flex;
          flex-direction: column;
        }
        .ref-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 10px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
        }
        .ref-row:last-child {
          border-bottom: none;
        }
        .ref-label {
          color: #64748b;
          font-size: 10px;
        }
        .ref-value {
          font-weight: 600;
          color: #1e293b;
          text-align: right;
          max-width: 60%;
        }

        /* Product Table */
        .product-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          border: 1px solid #cbd5e1;
        }
        .product-table thead th {
          background: #1e3a5f;
          color: #fff;
          padding: 7px 8px;
          font-size: 10px;
          font-weight: 600;
          text-align: center;
          letter-spacing: 0.3px;
        }
        .product-table thead th:first-child {
          text-align: center;
          width: 30px;
        }
        .product-table thead th.text-left {
          text-align: left;
        }
        .product-table thead th.text-right {
          text-align: right;
        }
        .product-table tbody td {
          padding: 6px 8px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
          color: #334155;
        }
        .product-table tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        .product-table tbody tr:last-child td {
          border-bottom: none;
        }
        .product-table .col-no {
          text-align: center;
          color: #94a3b8;
          font-size: 10px;
          width: 30px;
        }
        .product-table .col-code {
          font-family: monospace;
          font-size: 10px;
          color: #64748b;
          width: 90px;
        }
        .product-table .col-name {
          font-weight: 500;
        }
        .product-table .col-pack {
          text-align: center;
          width: 50px;
        }
        .product-table .col-qty {
          text-align: center;
          font-weight: 600;
          width: 50px;
        }
        .product-table .col-unit-price,
        .product-table .col-carton-price,
        .product-table .col-total {
          text-align: right;
          width: 90px;
        }
        .product-table .col-total {
          font-weight: 600;
          color: #1e293b;
        }
        .price-special {
          display: inline-block;
          font-size: 9px;
          background: #fef3c7;
          color: #92400e;
          padding: 1px 5px;
          border-radius: 3px;
          margin-left: 4px;
        }

        /* Bottom Section */
        .bottom-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }

        /* Notes */
        .notes-box {
          border: 1px solid #cbd5e1;
          padding: 10px;
        }
        .notes-title {
          font-weight: 700;
          font-size: 10px;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .notes-text {
          font-size: 11px;
          color: #334155;
          white-space: pre-wrap;
          line-height: 1.6;
        }

        /* Totals */
        .totals-box {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 12px;
          border: 1px solid #cbd5e1;
          border-bottom: none;
          font-size: 11px;
        }
        .total-row:last-of-type {
          border-bottom: 1px solid #cbd5e1;
        }
        .total-row .t-label {
          color: #475569;
          font-weight: 500;
        }
        .total-row .t-value {
          font-weight: 600;
          color: #1e293b;
        }
        .total-row .t-value.discount {
          color: #dc2626;
        }
        .grand-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #1e3a5f;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          margin-top: 4px;
        }

        /* Signature Section */
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          margin-top: 40px;
          padding-top: 16px;
        }
        .signature-block {
          text-align: center;
        }
        .signature-line {
          border-bottom: 1px solid #94a3b8;
          height: 40px;
          margin-bottom: 6px;
        }
        .signature-label {
          font-size: 11px;
          color: #475569;
          font-weight: 600;
        }
        .signature-sublabel {
          font-size: 10px;
          color: #94a3b8;
          margin-top: 2px;
        }

        /* Print Styles */
        @media print {
          .sales-record-document {
            width: 100%;
            padding: 8mm 10mm;
            box-shadow: none;
            border: none;
          }
        }

        /* Screen shadow for preview */
        @media screen {
          .sales-record-document {
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e8f0;
          }
        }
      `}</style>

      {/* Header */}
      <div className="doc-header">
        <div className="doc-header-left">
          <div className="company-main-info">
            <div className="company-logo">
              <Image
                src="/images/logo.png"
                alt="Central Foods Logo"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
            <div className="company-info">
              <p className="company-name">บริษัท คร็อพ ซายน์ จำกัด</p>
              <p className="company-title">Crop Science CO., LTD.</p>
              <p className="company-subtitle">เลขที่ 22 อาคารไอซีจี ถนนพระรามที่ 6 แขวงพญาไท เขตพญาไท กรุงเทพฯ 10400</p>
              <p className="company-subtitle">โทร. 02-271-4343 แฟกซ์: 02-618-4530</p>
            </div>
          </div>
          <h1 className="doc-title">ใบบันทึกการขาย</h1>
        </div>
        <div className="doc-header-right">
          {/* <p className="sale-number-label">เลขที่เอกสาร</p>
          <p className="sale-number">{sale.saleNumber}</p>
          <p className="sale-date">
            วันที่:{" "}
            {format(new Date(sale.saleDate), "dd MMMM yyyy", { locale: th })}
          </p> */}
        </div>
      </div>

      {/* Info Grid */}
      <div className="info-grid">
        {/* Billing Address */}
        <div className="info-section">
          <div className="info-section-header">ข้อมูลลูกค้า</div>
          <div className="info-section-body">
            <div className="name">{sale.customer.name}</div>
            <div className="name">ที่อยู่วางบิล</div>
            <div className="billing-address-text">{billingAddress}</div>
            {sale.customer.taxId && (
              <div className="info-detail">
                เลขผู้เสียภาษี: {sale.customer.taxId}
              </div>
            )}
            {sale.customer.phone && (
              <div className="info-detail">โทร: {sale.customer.phone}</div>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="info-section">
          <div className="info-section-header">ข้อมูลจัดส่ง</div>
          <div className="info-section-body">
            <div className="info-detail">
              <strong>วิธีการจัดส่ง:</strong> {deliveryMethodLabel}
            </div>
            {deliveryMethod !== "SALES_DELIVERY" &&
              deliveryMethod !== "FACTORY_DELIVERY" && (
                <div className="info-detail">
                  <strong>บริษัทขนส่ง:</strong> {shippingCompanyName}
                </div>
              )}
            <div className="name" style={{ marginTop: "8px" }}>
              ที่อยู่จัดส่งสินค้า
            </div>
            <div className="address-text">{displayShippingAddress}</div>
          </div>
        </div>

        {/* Reference Info */}
        <div className="info-section">
          <div className="info-section-header">ข้อมูลอ้างอิง</div>
          <div className="ref-rows">
            <div className="ref-row">
              <span className="ref-label">วันที่:</span>
              <span className="ref-value">
                {format(new Date(sale.saleDate), "dd/MM/yyyy", { locale: th })}
              </span>
            </div>
            <div className="ref-row">
              <span className="ref-label">เลขที่:</span>
              <span className="ref-value">{sale.saleNumber}</span>
            </div>
            <div className="ref-row">
              <span className="ref-label">เงื่อนไขชำระเงิน:</span>
              <span className="ref-value">{paymentTermLabel}</span>
            </div>
            {(sale as any).deliveryDate && (
              <div className="ref-row">
                <span className="ref-label">วันจัดส่ง:</span>
                <span className="ref-value">
                  {format(
                    new Date((sale as any).deliveryDate),
                    "dd/MM/yyyy",
                    { locale: th }
                  )}
                </span>
              </div>
            )}
            {sale.creditDueDate && (
              <div className="ref-row">
                <span className="ref-label">วันครบกำหนด:</span>
                <span className="ref-value">
                  {format(new Date(sale.creditDueDate), "dd/MM/yyyy", {
                    locale: th,
                  })}
                </span>
              </div>
            )}
            {sale.paymentDate && (
              <div className="ref-row">
                <span className="ref-label">วันชำระเงิน:</span>
                <span className="ref-value">
                  {format(new Date(sale.paymentDate), "dd/MM/yyyy", {
                    locale: th,
                  })}
                </span>
              </div>
            )}
            <div className="ref-row">
              <span className="ref-label">ผู้ขาย:</span>
              <span className="ref-value">{sale.employee.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <table className="product-table">
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th className="text-left">รหัสสินค้า</th>
            <th className="text-left">รายละเอียดสินค้า</th>
            <th>บรรจุ</th>
            <th>จำนวน</th>
            <th className="text-right">ราคา/หน่วย</th>
            <th className="text-right">ราคา/ลัง</th>
            <th className="text-right">รวม</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, idx) => {
            const packSize = parseFloat(
              item.product.packageSizePerBox || "1"
            );
            const multiplier =
              isNaN(packSize) || packSize <= 0 ? 1 : packSize;
            const cartonPrice = Number(item.unitPrice) * multiplier;

            return (
              <tr key={item.id}>
                <td className="col-no">{idx + 1}</td>
                <td className="col-code">{item.product.productCode}</td>
                <td className="col-name">
                  {item.product.name}
                  {item.priceModified && (
                    <span className="price-special">ราคาพิเศษ</span>
                  )}
                </td>
                <td className="col-pack">
                  {item.product.packageSizePerBox || "-"}
                </td>
                <td className="col-qty">{item.quantity}</td>
                <td className="col-unit-price">
                  {Number(item.unitPrice).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="col-carton-price">
                  {Number(cartonPrice).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="col-total">
                  {Number(item.totalPrice).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Bottom Section: Notes + Totals */}
      <div className="bottom-section">
        <div>
          {sale.notes && (
            <div className="notes-box">
              <div className="notes-title">หมายเหตุ</div>
              <div className="notes-text">{sale.notes}</div>
            </div>
          )}
        </div>

        <div className="totals-box">
          <div className="total-row">
            <span className="t-label">รวมเป็นเงิน</span>
            <span className="t-value">
              {Number(sale.subtotalAmount).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          {Number(sale.shippingCost) > 0 && (
            <div className="total-row">
              <span className="t-label">ส่วนลดค่าขนส่ง</span>
              <span className="t-value discount">
                -
                {Number(sale.shippingCost).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {Number(sale.otherCosts) > 0 && (
            <div className="total-row">
              <span className="t-label">ส่วนลดหน้าบิล</span>
              <span className="t-value discount">
                -
                {Number(sale.otherCosts).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          <div className="grand-total-row">
            <span>ยอดสุทธิ</span>
            <span>
              ฿
              {Number(sale.totalAmount).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="signature-section">
        <div className="signature-block">
          <div className="signature-line" />
          <div className="signature-label">ผู้ส่งสินค้า</div>
          <div className="signature-sublabel">
            วันที่ ......./......./...​....
          </div>
        </div>
        <div className="signature-block">
          <div className="signature-line" />
          <div className="signature-label">ผู้รับสินค้า</div>
          <div className="signature-sublabel">
            วันที่ ......./......./...​....
          </div>
        </div>
      </div>
    </div>
  );
});

SalesRecordDocument.displayName = "SalesRecordDocument";

export default SalesRecordDocument;
