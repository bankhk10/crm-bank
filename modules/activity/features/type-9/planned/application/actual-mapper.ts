import type { Type9ImageFile, Type9ProductSaleDetail } from "../../shared/types";
import type { Type9ActualRecord } from "../types/actual.types";

function toImage(att: any): Type9ImageFile {
  return {
    id: att.id,
    url: att.fileUrl || att.url,
    name: att.fileName || att.name || "รูปภาพหน้าร้าน",
    size: att.fileSize ?? att.size ?? undefined,
    type: att.fileType ?? att.mimeType ?? undefined,
  };
}

/**
 * Pure parser for Type 9 Actual Outcome Data
 */
export function parseType9ActualResult(resData: any): Partial<
  Type9ActualRecord & {
    t9ActualSales?: string;
    t9ActualAttendees?: string;
    t9ProductSalesDetails?: Type9ProductSaleDetail[];
    t9Images?: Type9ImageFile[];
  }
> {
  const parsed: Partial<
    Type9ActualRecord & {
      t9ActualSales?: string;
      t9ActualAttendees?: string;
      t9ProductSalesDetails?: Type9ProductSaleDetail[];
      t9Images?: Type9ImageFile[];
    }
  > = {};

  if (!resData) return parsed;

  // 1. Direct collections from normalized relations (saleResults)
  if (Array.isArray(resData.saleResults) && resData.saleResults.length > 0) {
    const t9Sales = resData.saleResults.filter(
      (s: any) =>
        s.workTypeCode === "TYPE_9" ||
        s.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
    );
    if (t9Sales.length > 0) {
      const details: Type9ProductSaleDetail[] = t9Sales.map((s: any) => ({
        id: s.id,
        productId: s.productId,
        productName: s.productName || s.product?.name || "",
        actualQuantityCases: Number(s.actualQuantity || 0),
        pricePerCase: Number(s.actualUnitPrice || 0),
        actualSales: Number(s.actualTotal || 0),
        storeId: s.storeId,
      }));
      parsed.productSalesDetails = details;
      parsed.t9ProductSalesDetails = details;

      const totalSales = details.reduce(
        (sum, it) => sum + (Number(it.actualSales) || 0),
        0,
      );
      if (totalSales > 0) {
        parsed.actualSales = String(totalSales);
        parsed.t9ActualSales = String(totalSales);
      }
    }
  }

  // 2. Attachments
  if (Array.isArray(resData.attachments) && resData.attachments.length > 0) {
    const t9Att = resData.attachments.filter(
      (a: any) =>
        a.workTypeCode === "TYPE_9" ||
        a.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
    );
    if (t9Att.length > 0) {
      const imgs = t9Att.map(toImage);
      parsed.images = imgs;
      parsed.t9Images = imgs;
    }
  }

  // 3. Header fields
  if (resData.actualAttendeesCount != null) {
    const attendees = String(resData.actualAttendeesCount);
    parsed.actualAttendees = attendees;
    parsed.t9ActualAttendees = attendees;
  }
  if (resData.salesResultAmount != null && !parsed.actualSales) {
    const sales = String(resData.salesResultAmount);
    parsed.actualSales = sales;
    parsed.t9ActualSales = sales;
  }

  // 4. Regex fallback from resultSummary text
  const summaryText = resData.resultSummary || "";
  if (summaryText && typeof summaryText === "string") {
    const t9SalesMatch = summaryText.match(/ยอดขายหน้าร้านจริง:\s*(.+)/);
    if (t9SalesMatch && t9SalesMatch[1] && !parsed.t9ActualSales) {
      const sales = t9SalesMatch[1].split("\n")[0].trim();
      parsed.t9ActualSales = sales;
      parsed.actualSales = sales;
    }

    const t9ProductsMatch = summaryText.match(
      /(?:ยอดขายแยกสินค้าหน้าร้าน|t9ProductSalesDetails):\s*(\[.+\])/,
    );
    if (
      t9ProductsMatch &&
      t9ProductsMatch[1] &&
      (!parsed.t9ProductSalesDetails || parsed.t9ProductSalesDetails.length === 0)
    ) {
      try {
        const json = JSON.parse(t9ProductsMatch[1].trim());
        if (Array.isArray(json)) {
          parsed.t9ProductSalesDetails = json;
          parsed.productSalesDetails = json;
        }
      } catch (e) {
        console.error("Failed to parse t9ProductSalesDetails JSON:", e);
      }
    }

    const t9AttendeesMatch = summaryText.match(
      /(?:เกษตรกรที่เข้าร่วมจริง|ผู้เข้าร่วมหน้าร้านจริง|t9ActualAttendees):\s*(.+)/,
    );
    if (t9AttendeesMatch && t9AttendeesMatch[1] && !parsed.t9ActualAttendees) {
      const att = t9AttendeesMatch[1].split("\n")[0].trim();
      parsed.t9ActualAttendees = att;
      parsed.actualAttendees = att;
    }

    const t9ImagesMatch = summaryText.match(
      /(?:รูปภาพกิจกรรมส่งเสริมการขายหน้าร้าน|ภาพถ่ายกิจกรรมส่งเสริมการขายหน้าร้าน|รูปภาพหน้าร้าน|t9Images):\s*(\[.+\])/,
    );
    if (
      t9ImagesMatch &&
      t9ImagesMatch[1] &&
      (!parsed.t9Images || parsed.t9Images.length === 0)
    ) {
      try {
        const json = JSON.parse(t9ImagesMatch[1].trim());
        if (Array.isArray(json)) {
          parsed.t9Images = json;
          parsed.images = json;
        }
      } catch (e) {
        console.error("Failed to parse t9Images JSON:", e);
      }
    }
  }

  return parsed;
}
