import { NextResponse, NextRequest } from "next/server";
import {
  createPdfFromSaleData,
  createSamplePdf,
} from "@/modules/create-pdf/application/generate-pdf";
import { getSaleAction } from "@/modules/sales/server/actions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const saleId = searchParams.get("saleId");

    let pdfBuffer: Buffer;
    let filename = "sample-invoice.pdf";

    if (saleId) {
      // ดึงข้อมูลจริงจากระบบ
      const saleResult = await getSaleAction(saleId);
      if (!saleResult.success || !saleResult.sale) {
        return NextResponse.json(
          { error: saleResult.error || "ไม่พบข้อมูลรายการขาย" },
          { status: 404 },
        );
      }
      pdfBuffer = await createPdfFromSaleData(saleResult.sale);
      filename = `${saleResult.sale.saleNumber}.pdf`;
    } else {
      // ใช้ข้อมูลตัวอย่าง
      pdfBuffer = await createSamplePdf();
    }

    // สร้าง Response ส่งกลับไปเป็นไฟล์ PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        // ใช้ inline เพื่อเปิด Preview ในเบราว์เซอร์ ถ้าโหลดมาเลยให้เปลี่ยนเป็น attachment
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้าง PDF" },
      { status: 500 },
    );
  }
}
