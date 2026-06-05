import * as repo from "../infrastructure/reports.repository";
import { MonthlySalesOverviewData } from "../types";

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export async function getMonthlySalesOverview(year: number, session: any): Promise<MonthlySalesOverviewData> {

  // Fetch all three datasets in parallel
  const [totalSales, salesNotes, invoices] = await Promise.all([
    repo.findMonthlyTotalSalesByYear(year),
    repo.findMonthlySalesNoteSalesByYear(year),
    repo.findMonthlyInvoiceSalesByYear(year),
  ]);

  // Build maps for quick lookup
  const totalSalesMap = new Map(totalSales.map((r) => [r.month, r]));
  const salesNoteMap = new Map(salesNotes.map((r) => [r.month, r]));
  const invoiceMap = new Map(invoices.map((r) => [r.month, r]));

  // Build monthly data for all 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const total = totalSalesMap.get(monthNum);
    const salesNote = salesNoteMap.get(monthNum);
    const invoice = invoiceMap.get(monthNum);

    return {
      month: monthNum,
      monthName: THAI_MONTHS[i],
      monthShort: THAI_MONTHS_SHORT[i],
      totalSales: total?.totalAmount ?? 0,
      totalOrders: total?.orderCount ?? 0,
      salesNoteAmount: salesNote?.totalAmount ?? 0,
      salesNoteCount: salesNote?.orderCount ?? 0,
      invoiceAmount: invoice?.totalAmount ?? 0,
      invoiceCount: invoice?.invoiceCount ?? 0,
    };
  });

  // Calculate totals
  const grandTotalSales = months.reduce((sum, m) => sum + m.totalSales, 0);
  const grandSalesNote = months.reduce((sum, m) => sum + m.salesNoteAmount, 0);
  const grandInvoice = months.reduce((sum, m) => sum + m.invoiceAmount, 0);
  const grandTotalOrders = months.reduce((sum, m) => sum + m.totalOrders, 0);
  const grandSalesNoteCount = months.reduce(
    (sum, m) => sum + m.salesNoteCount,
    0,
  );
  const grandInvoiceCount = months.reduce(
    (sum, m) => sum + m.invoiceCount,
    0,
  );

  // Calculate current month total for highlight
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const isCurrentYear = year === now.getFullYear();
  const currentMonthData = isCurrentYear ? months[currentMonth - 1] : null;

  return {
    year,
    months,
    totals: {
      totalSales: grandTotalSales,
      totalOrders: grandTotalOrders,
      salesNoteAmount: grandSalesNote,
      salesNoteCount: grandSalesNoteCount,
      invoiceAmount: grandInvoice,
      invoiceCount: grandInvoiceCount,
    },
    currentMonthHighlight: currentMonthData
      ? {
          month: currentMonth,
          monthName: THAI_MONTHS[currentMonth - 1],
          totalSales: currentMonthData.totalSales,
          salesNoteAmount: currentMonthData.salesNoteAmount,
          invoiceAmount: currentMonthData.invoiceAmount,
        }
      : null,
  };
}
