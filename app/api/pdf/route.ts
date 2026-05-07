import { NextResponse, NextRequest } from "next/server";
import { createPdfFromSaleData, createSpecialPdfFromSaleData } from "@/modules/create-pdf/application/generate-pdf";
import { createShipmentDeliveryNotePdf } from "@/modules/create-pdf/application/generate-shipment-pdf";
import { getSaleAction } from "@/modules/sales/server/actions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const saleId = searchParams.get("saleId");
    const shipmentId = searchParams.get("shipmentId");

    let pdfBuffer: Buffer;
    let filename = "document.pdf";

    if (shipmentId) {
      pdfBuffer = await createShipmentDeliveryNotePdf(shipmentId);
      filename = `shipment-${shipmentId}.pdf`;
    } else if (saleId) {
      // ดึงข้อมูลจริงจากระบบ
      const saleResult = await getSaleAction(saleId);
      if (!saleResult.success || !saleResult.sale) {
        return NextResponse.json(
          { error: saleResult.error || "ไม่พบข้อมูลรายการขาย" },
          { status: 404 },
        );
      }

      const type = searchParams.get("type");
      if (type === "special") {
        pdfBuffer = await createSpecialPdfFromSaleData(saleResult.sale);
        filename = `special-${saleResult.sale.saleNumber}.pdf`;
      } else {
        pdfBuffer = await createPdfFromSaleData(saleResult.sale);
        filename = `${saleResult.sale.saleNumber}.pdf`;
      }
    } else {
      // ใช้ข้อมูลตัวอย่าง
      return NextResponse.json(
        { error: "ไม่พบข้อมูลรายการขาย" },
        { status: 404 },
      );
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
